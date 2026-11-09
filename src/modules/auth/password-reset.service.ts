import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { randomInt } from "node:crypto";

import { MailService } from "../../infrastructure/mail/mail.service";
import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import {
  PasswordResetCompletedDto,
  PasswordResetRequestedDto,
} from "./dto/password-reset.dto";

const CODE_TTL_MINUTES = 15;
const GENERIC_MESSAGE =
  "Se este e-mail estiver cadastrado, enviaremos um código de recuperação.";

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async requestCode(email: string): Promise<PasswordResetRequestedDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, isActive: true },
    });

    if (!user?.isActive) {
      return { message: GENERIC_MESSAGE };
    }

    const code = this.generateCode();
    const codeHash = await this.hash(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.passwordResetCode.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetCode.create({
        data: { userId: user.id, codeHash, expiresAt },
      }),
    ]);

    try {
      await this.mailService.sendEmail(
        user.email,
        "Código de recuperação de senha - Ninho",
        this.buildEmail(code),
        `Seu código de recuperação do Ninho é ${code}. Ele expira em ${CODE_TTL_MINUTES} minutos. Se você não solicitou, ignore este e-mail.`,
      );
    } catch (error) {
      this.logger.error(
        { userId: user.id, error },
        "Não foi possível enviar o e-mail de recuperação de senha",
      );
    }

    const exposeCode = this.configService.get<string>("app.env") !== "production";
    return {
      message: GENERIC_MESSAGE,
      ...(exposeCode ? { devCode: code } : {}),
    };
  }

  async resetPassword(input: {
    email: string;
    code: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<PasswordResetCompletedDto> {
    if (input.password !== input.passwordConfirmation) {
      throw new BadRequestException({
        code: "PASSWORD_CONFIRMATION_MISMATCH",
        message: "As senhas não coincidem",
      });
    }

    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (!user?.isActive) {
      throw this.invalidCode();
    }

    const resetCode = await this.prisma.passwordResetCode.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetCode || !(await this.verify(resetCode.codeHash, input.code))) {
      throw this.invalidCode();
    }

    const passwordHash = await this.hash(input.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, refreshTokenHash: null },
      }),
      this.prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Senha atualizada com sucesso." };
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  private async hash(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
  }

  private async verify(hash: string, value: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, value);
    } catch {
      return false;
    }
  }

  private invalidCode(): BadRequestException {
    return new BadRequestException({
      code: "INVALID_RESET_CODE",
      message: "Código inválido ou expirado",
    });
  }

  private buildEmail(code: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2f2440;">
        <h2 style="color: #6b4fa8;">Recuperação de senha do Ninho</h2>
        <p>Recebemos um pedido para redefinir sua senha. Use o código abaixo:</p>
        <p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2f2440;">${code}</p>
        <p>O código expira em ${CODE_TTL_MINUTES} minutos.</p>
        <p>Se você não solicitou a recuperação, ignore este e-mail. Sua senha continua a mesma.</p>
        <p style="color: #6f6880; font-size: 12px;">Ninho — um espaço seguro para você.</p>
      </div>
    `;
  }
}
