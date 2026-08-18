import { Module } from '@nestjs/common';
import { CommunityController } from './presentation/controllers/community.controller';
import { CommunityService } from './application/community.service';
import { PostRepository } from './domain/ports/post.repository';
import { PrismaPostRepository } from './infrastructure/persistence/prisma-post.repository';
import { CommentRepository } from './domain/ports/comment.repository';
import { PrismaCommentRepository } from './infrastructure/persistence/prisma-comment.repository';
import { ReactionRepository } from './domain/ports/reaction.repository';
import { PrismaReactionRepository } from './infrastructure/persistence/prisma-reaction.repository';

@Module({
  controllers: [CommunityController],
  providers: [
    CommunityService,
    { provide: PostRepository, useClass: PrismaPostRepository },
    { provide: CommentRepository, useClass: PrismaCommentRepository },
    { provide: ReactionRepository, useClass: PrismaReactionRepository },
  ],
  exports: [CommunityService, PostRepository, CommentRepository, ReactionRepository],
})
export class CommunityModule {}