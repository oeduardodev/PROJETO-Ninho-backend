import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CommunityPost, Prisma, User } from "@prisma/client";
import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { getDefaultProfile } from "../users/domain/default-profile";
import {
  CommentPageDto,
  CommentQueryDto,
  CommunityAuthorDto,
  CommunityCommentDto,
  CommunityPostDto,
  CommunityWelcomeDto,
  CreateCommentDto,
  CreatePostDto,
  PostPageDto,
  PostQueryDto,
  UpdateCommunityProfileDto,
  UpdatePostDto,
} from "./dto/community.dto";

const authorSelect = {
  id: true,
  communityName: true,
  communityHandle: true,
  avatarEmoji: true,
  avatarBg: true,
} satisfies Prisma.UserSelect;

type Author = Pick<
  User,
  "id" | "communityName" | "communityHandle" | "avatarEmoji" | "avatarBg"
>;
type PostRecord = CommunityPost & {
  author: Author;
  _count: { comments: number; welcomes: number };
  welcomes: { userId: string }[];
};
type CommentRecord = {
  id: string;
  postId: string;
  author: Author;
  text: string;
  createdAt: Date;
};

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMyProfile(userId: string): Promise<CommunityAuthorDto> {
    await this.ensureActive(userId);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: authorSelect,
    });
    return this.toAuthor(user);
  }

  async updateMyProfile(
    userId: string,
    input: UpdateCommunityProfileDto,
  ): Promise<CommunityAuthorDto> {
    await this.ensureActive(userId);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { communityName: input.name } : {}),
          ...(input.handle !== undefined
            ? { communityHandle: input.handle }
            : {}),
          ...(input.avatarEmoji !== undefined
            ? { avatarEmoji: input.avatarEmoji }
            : {}),
          ...(input.avatarBg !== undefined ? { avatarBg: input.avatarBg } : {}),
        },
        select: authorSelect,
      });
      return this.toAuthor(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException({
          code: "COMMUNITY_HANDLE_TAKEN",
          message: "Este nome de usuário já está em uso",
        });
      }
      throw error;
    }
  }

  async listPosts(userId: string, query: PostQueryDto): Promise<PostPageDto> {
    await this.ensureActive(userId);
    if (query.cursor) await this.ensurePost(query.cursor, "INVALID_CURSOR");
    const limit = query.limit ?? 20;
    const posts = await this.prisma.communityPost.findMany({
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy:
        query.filter === "recentes"
          ? [{ createdAt: "desc" }, { id: "desc" }]
          : [
              { welcomes: { _count: "desc" } },
              { createdAt: "desc" },
              { id: "desc" },
            ],
      include: this.postInclude(userId),
    });
    const page = posts.slice(0, limit);
    return {
      items: page.map((post) => this.toPost(post)),
      nextCursor: posts.length > limit ? page[page.length - 1].id : null,
    };
  }

  async getPost(userId: string, postId: string): Promise<CommunityPostDto> {
    await this.ensureActive(userId);
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: this.postInclude(userId),
    });
    if (!post) throw this.postNotFound();
    return this.toPost(post);
  }

  async createPost(
    userId: string,
    input: CreatePostDto,
  ): Promise<CommunityPostDto> {
    await this.ensureActive(userId);
    const post = await this.prisma.communityPost.create({
      data: {
        authorId: userId,
        text: input.text,
        tag: input.tag ?? "Desabafo",
      },
      include: this.postInclude(userId),
    });
    return this.toPost(post);
  }

  async updatePost(
    userId: string,
    postId: string,
    input: UpdatePostDto,
  ): Promise<CommunityPostDto> {
    await this.ensureActive(userId);
    if (input.text === undefined && input.tag === undefined) {
      throw new BadRequestException({
        code: "EMPTY_UPDATE",
        message: "Informe o texto ou a categoria a atualizar",
      });
    }
    const post = await this.ensurePost(postId);
    if (post.authorId !== userId) {
      throw new ForbiddenException({
        code: "NOT_POST_AUTHOR",
        message: "Você só pode editar suas publicações",
      });
    }
    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.tag !== undefined ? { tag: input.tag } : {}),
      },
      include: this.postInclude(userId),
    });
    return this.toPost(updated);
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    await this.ensureActive(userId);
    const post = await this.ensurePost(postId);
    if (post.authorId !== userId) {
      throw new ForbiddenException({
        code: "NOT_POST_AUTHOR",
        message: "Você só pode excluir suas publicações",
      });
    }
    await this.prisma.communityPost.deleteMany({
      where: { id: postId, authorId: userId },
    });
  }

  async setWelcome(
    userId: string,
    postId: string,
    welcomed: boolean,
  ): Promise<CommunityWelcomeDto> {
    await this.ensureActive(userId);
    const post = await this.ensurePost(postId);
    if (welcomed) {
      const existing = await this.prisma.communityWelcome.findUnique({
        where: { postId_userId: { postId, userId } },
        select: { userId: true },
      });
      await this.prisma.communityWelcome.upsert({
        where: { postId_userId: { postId, userId } },
        update: {},
        create: { postId, userId },
      });
      if (!existing) {
        await this.notifications.notifyWelcome({
          recipientId: post.authorId,
          actorId: userId,
          actorName: await this.resolveActorName(userId),
          postId,
        });
      }
    } else {
      await this.prisma.communityWelcome.deleteMany({
        where: { postId, userId },
      });
    }
    return {
      welcomeCount: await this.prisma.communityWelcome.count({
        where: { postId },
      }),
      welcomedByMe: welcomed,
    };
  }

  async listComments(
    userId: string,
    postId: string,
    query: CommentQueryDto,
  ): Promise<CommentPageDto> {
    await this.ensureActive(userId);
    await this.ensurePost(postId);
    if (query.cursor) {
      const cursor = await this.prisma.communityComment.findUnique({
        where: { id: query.cursor },
        select: { postId: true },
      });
      if (cursor?.postId !== postId) {
        throw new BadRequestException({
          code: "INVALID_CURSOR",
          message: "Cursor de comentário inválido",
        });
      }
    }
    const limit = query.limit ?? 30;
    const comments = await this.prisma.communityComment.findMany({
      where: { postId },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { author: { select: authorSelect } },
    });
    const page = comments.slice(0, limit);
    return {
      items: page.map((comment) => this.toComment(comment)),
      nextCursor: comments.length > limit ? page[page.length - 1].id : null,
    };
  }

  async createComment(
    userId: string,
    postId: string,
    input: CreateCommentDto,
  ): Promise<CommunityCommentDto> {
    await this.ensureActive(userId);
    const post = await this.ensurePost(postId);
    const comment = await this.prisma.communityComment.create({
      data: { postId, authorId: userId, text: input.text },
      include: { author: { select: authorSelect } },
    });
    await this.notifications.notifyComment({
      recipientId: post.authorId,
      actorId: userId,
      actorName: await this.resolveActorName(userId),
      postId,
      commentId: comment.id,
    });
    return this.toComment(comment);
  }

  private async resolveActorName(userId: string): Promise<string> {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { communityName: true },
    });
    return actor?.communityName ?? getDefaultProfile(userId).name;
  }

  async deleteComment(
    userId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    await this.ensureActive(userId);
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
      select: { postId: true, authorId: true },
    });
    if (comment?.postId !== postId) {
      throw new NotFoundException({
        code: "COMMENT_NOT_FOUND",
        message: "Comentário não encontrado",
      });
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException({
        code: "NOT_COMMENT_AUTHOR",
        message: "Você só pode excluir seus comentários",
      });
    }
    await this.prisma.communityComment.deleteMany({
      where: { id: commentId, postId, authorId: userId },
    });
  }

  private postInclude(userId: string) {
    return {
      author: { select: authorSelect },
      _count: { select: { comments: true, welcomes: true } },
      welcomes: { where: { userId }, select: { userId: true } },
    } as const;
  }

  private toPost(post: PostRecord): CommunityPostDto {
    return {
      id: post.id,
      author: this.toAuthor(post.author),
      tag: post.tag,
      text: post.text,
      welcomeCount: post._count.welcomes,
      commentCount: post._count.comments,
      welcomedByMe: post.welcomes.length > 0,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private toComment(comment: CommentRecord): CommunityCommentDto {
    return {
      id: comment.id,
      postId: comment.postId,
      author: this.toAuthor(comment.author),
      text: comment.text,
      createdAt: comment.createdAt,
    };
  }

  private toAuthor(user: Author): CommunityAuthorDto {
    const fallback = getDefaultProfile(user.id);
    return {
      id: user.id,
      name: user.communityName ?? fallback.name,
      handle: `@${user.communityHandle ?? fallback.handle}`,
      avatarEmoji: user.avatarEmoji ?? (user.communityName ? "🙂" : ""),
      avatarBg: user.avatarBg ?? "#E8F0E6",
    };
  }

  private async ensureActive(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      throw new ForbiddenException({
        code: "USER_INACTIVE",
        message: "Conta não disponível",
      });
    }
  }

  private async ensurePost(
    postId: string,
    missingCode = "POST_NOT_FOUND",
  ): Promise<{ authorId: string }> {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) {
      if (missingCode === "INVALID_CURSOR") {
        throw new BadRequestException({
          code: missingCode,
          message: "Cursor de publicação inválido",
        });
      }
      throw this.postNotFound();
    }
    return post;
  }

  private postNotFound(): NotFoundException {
    return new NotFoundException({
      code: "POST_NOT_FOUND",
      message: "Publicação não encontrada",
    });
  }
}
