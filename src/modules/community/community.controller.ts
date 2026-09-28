import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ParseUUIDPipe } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CommunityService } from "./community.service";
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
} from "./dto/community.dto";

@ApiTags("Community")
@ApiBearerAuth()
@Controller("community")
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get("profile/me")
  @ApiOperation({ summary: "Consultar meu perfil público da comunidade" })
  @ApiOkResponse({ type: CommunityAuthorDto })
  getMyProfile(@CurrentUser("sub") userId: string): Promise<CommunityAuthorDto> {
    return this.community.getMyProfile(userId);
  }

  @Patch("profile/me")
  @ApiOperation({ summary: "Personalizar meu perfil público da comunidade" })
  @ApiOkResponse({ type: CommunityAuthorDto })
  updateMyProfile(
    @CurrentUser("sub") userId: string,
    @Body() input: UpdateCommunityProfileDto,
  ): Promise<CommunityAuthorDto> {
    return this.community.updateMyProfile(userId, input);
  }

  @Get("posts")
  @ApiOperation({
    summary: "Listar publicações",
    description:
      "O filtro 'para' prioriza publicações com mais acolhimentos; 'recentes' ordena por data. Use nextCursor para buscar a próxima página.",
  })
  @ApiOkResponse({ type: PostPageDto })
  listPosts(
    @CurrentUser("sub") userId: string,
    @Query() query: PostQueryDto,
  ): Promise<PostPageDto> {
    return this.community.listPosts(userId, query);
  }

  @Post("posts")
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: "Criar publicação" })
  @ApiCreatedResponse({ type: CommunityPostDto })
  createPost(
    @CurrentUser("sub") userId: string,
    @Body() input: CreatePostDto,
  ): Promise<CommunityPostDto> {
    return this.community.createPost(userId, input);
  }

  @Get("posts/:postId")
  @ApiOperation({ summary: "Consultar publicação" })
  @ApiOkResponse({ type: CommunityPostDto })
  getPost(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
  ): Promise<CommunityPostDto> {
    return this.community.getPost(userId, postId);
  }

  @Delete("posts/:postId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Excluir minha publicação" })
  @ApiNoContentResponse()
  deletePost(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
  ): Promise<void> {
    return this.community.deletePost(userId, postId);
  }

  @Put("posts/:postId/welcome")
  @ApiOperation({ summary: "Acolher uma publicação" })
  @ApiOkResponse({ type: CommunityWelcomeDto })
  addWelcome(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
  ): Promise<CommunityWelcomeDto> {
    return this.community.setWelcome(userId, postId, true);
  }

  @Delete("posts/:postId/welcome")
  @ApiOperation({ summary: "Remover meu acolhimento" })
  @ApiOkResponse({ type: CommunityWelcomeDto })
  removeWelcome(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
  ): Promise<CommunityWelcomeDto> {
    return this.community.setWelcome(userId, postId, false);
  }

  @Get("posts/:postId/comments")
  @ApiOperation({ summary: "Listar comentários de uma publicação" })
  @ApiOkResponse({ type: CommentPageDto })
  listComments(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
    @Query() query: CommentQueryDto,
  ): Promise<CommentPageDto> {
    return this.community.listComments(userId, postId, query);
  }

  @Post("posts/:postId/comments")
  @Throttle({ default: { limit: 30, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: "Comentar em uma publicação" })
  @ApiCreatedResponse({ type: CommunityCommentDto })
  createComment(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
    @Body() input: CreateCommentDto,
  ): Promise<CommunityCommentDto> {
    return this.community.createComment(userId, postId, input);
  }

  @Delete("posts/:postId/comments/:commentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Excluir meu comentário" })
  @ApiNoContentResponse()
  deleteComment(
    @CurrentUser("sub") userId: string,
    @Param("postId", ParseUUIDPipe) postId: string,
    @Param("commentId", ParseUUIDPipe) commentId: string,
  ): Promise<void> {
    return this.community.deleteComment(userId, postId, commentId);
  }
}
