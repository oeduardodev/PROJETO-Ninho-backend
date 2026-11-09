import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { PasswordResetService } from "./password-reset.service";
import { AuthResponseDto, AuthUserDto } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import {
  ForgotPasswordDto,
  PasswordResetCompletedDto,
  PasswordResetRequestedDto,
  ResetPasswordDto,
} from "./dto/password-reset.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post("register")
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: "Cadastrar uma nova conta" })
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() input: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(input);
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: "Entrar com e-mail e senha" })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() input: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(input);
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60 * 1000 } })
  @ApiOperation({ summary: "Renovar os tokens da sessǜo" })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() input: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(input.refreshToken);
  }

  @Post("password/forgot")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @ApiOperation({
    summary: "Solicitar código de recuperação de senha",
    description:
      "Envia um código de 6 dígitos para o e-mail cadastrado. A resposta é genérica para não revelar se o e-mail existe.",
  })
  @ApiOkResponse({ type: PasswordResetRequestedDto })
  forgotPassword(
    @Body() input: ForgotPasswordDto,
  ): Promise<PasswordResetRequestedDto> {
    return this.passwordResetService.requestCode(input.email);
  }

  @Post("password/reset")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: "Redefinir a senha com o código recebido" })
  @ApiOkResponse({ type: PasswordResetCompletedDto })
  resetPassword(
    @Body() input: ResetPasswordDto,
  ): Promise<PasswordResetCompletedDto> {
    return this.passwordResetService.resetPassword(input);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Encerrar a sessão atual" })
  @ApiNoContentResponse()
  async logout(@CurrentUser("sub") userId: string): Promise<void> {
    await this.authService.logout(userId);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obter o usuário autenticado" })
  @ApiOkResponse({ type: AuthUserDto })
  getCurrentUser(@CurrentUser("sub") userId: string): Promise<AuthUserDto> {
    return this.authService.getCurrentUser(userId);
  }
}
