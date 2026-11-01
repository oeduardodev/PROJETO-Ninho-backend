import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ConversationsService } from "./conversations.service";
import {
  ContactQueryDto,
  ConversationContactDto,
  ConversationDto,
  ConversationMessageDto,
  ConversationPageDto,
  ConversationQueryDto,
  MessagePageDto,
  SendMessageDto,
  StartConversationDto,
} from "./dto/conversation.dto";

@ApiTags("Conversations")
@ApiBearerAuth()
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get("contacts")
  @ApiOperation({ summary: "Listar pessoas disponíveis para conversar" })
  @ApiOkResponse({ type: [ConversationContactDto] })
  listContacts(@CurrentUser("sub") userId: string, @Query() query: ContactQueryDto): Promise<ConversationContactDto[]> {
    return this.conversations.listContacts(userId, query);
  }

  @Get()
  @ApiOperation({ summary: "Listar minhas conversas" })
  @ApiOkResponse({ type: ConversationPageDto })
  listConversations(@CurrentUser("sub") userId: string, @Query() query: ConversationQueryDto): Promise<ConversationPageDto> {
    return this.conversations.listConversations(userId, query);
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: "Iniciar ou abrir conversa com uma pessoa" })
  @ApiCreatedResponse({ type: ConversationDto })
  startConversation(@CurrentUser("sub") userId: string, @Body() input: StartConversationDto): Promise<ConversationDto> {
    return this.conversations.startConversation(userId, input.recipientId);
  }

  @Get(":conversationId")
  @ApiOperation({ summary: "Consultar uma conversa da qual participo" })
  @ApiOkResponse({ type: ConversationDto })
  getConversation(@CurrentUser("sub") userId: string, @Param("conversationId", ParseUUIDPipe) conversationId: string): Promise<ConversationDto> {
    return this.conversations.getConversation(userId, conversationId);
  }

  @Get(":conversationId/messages")
  @ApiOperation({ summary: "Listar mensagens e marcar recebidas como lidas" })
  @ApiOkResponse({ type: MessagePageDto })
  listMessages(
    @CurrentUser("sub") userId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Query() query: ConversationQueryDto,
  ): Promise<MessagePageDto> {
    return this.conversations.listMessages(userId, conversationId, query);
  }

  @Post(":conversationId/messages")
  @Throttle({ default: { limit: 60, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: "Enviar mensagem de texto" })
  @ApiCreatedResponse({ type: ConversationMessageDto })
  sendMessage(
    @CurrentUser("sub") userId: string,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Body() input: SendMessageDto,
  ): Promise<ConversationMessageDto> {
    return this.conversations.sendMessage(userId, conversationId, input.text);
  }
}
