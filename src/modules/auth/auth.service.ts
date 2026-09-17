import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Prisma, User, UserRole as PrismaUserRole } from "@prisma/client";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { UserRole } from "../users/domain/value-objects/user-role.vo";
import {
  AuthResponseDto,
  AuthTokensDto,
  AuthUserDto,
} from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AccessTokenPayload, RefreshTokenPayload } from "./auth.types";

const JWT_ISSUER = "ninho-api";
const JWT_AUDIENCE = "ninho-app";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResponseDto> {
    if (input.password !== input.passwordConfirmation) {
      throw new BadRequestException({
        code: "PASSWORD_CONFIRMATION_MISMATCH",
        message: "As senhas não coincidem",
      });
    }

    const email = input.email.trim().toLowerCase();
    const phone = this.normalizePhone(input.phone);
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { email: true, phone: true },
    });

    if (existingUser) {
      this.throwDuplicateUser(existingUser, email);
    }

    const passwordHash = await this.hash(input.password);
    const userId = randomUUID();
    const tokens = await this.issueTokens({
      id: userId,
      email,
      role: PrismaUserRole.USER,
    });
    const refreshTokenHash = await this.hash(tokens.refreshToken);

    try {
      const user = await this.prisma.user.create({
        data: {
          id: userId,
          email,
          phone,
          passwordHash,
          refreshTokenHash,
          lastLoginAt: new Date(),
        },
      });

      return { user: this.toPublicUser(user), tokens };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException({
          code: "USER_ALREADY_EXISTS",
          message: "E-mail ou telefone já cadastrado",
        });
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await this.verifyHash(user.passwordHash, input.password))) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "E-mail ou senha inválidos",
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: "USER_INACTIVE",
        message: "Esta conta está desativada",
      });
    }

    const tokens = await this.issueTokens(user);
    await this.saveSession(user.id, tokens.refreshToken, true);

    return { user: this.toPublicUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user?.isActive || !user.refreshTokenHash) {
      throw this.invalidRefreshToken();
    }

    const tokenMatches = await this.verifyHash(
      user.refreshTokenHash,
      refreshToken,
    );
    if (!tokenMatches) {
      throw this.invalidRefreshToken();
    }

    const tokens = await this.issueTokens(user);
    await this.saveSession(user.id, tokens.refreshToken, false);

    return { user: this.toPublicUser(user), tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async getCurrentUser(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) {
      throw new UnauthorizedException({
        code: "USER_NOT_AVAILABLE",
        message: "Usuário não encontrado ou desativado",
      });
    }

    return this.toPublicUser(user);
  }

  private async issueTokens(
    user: Pick<User, "id" | "email" | "role">,
  ): Promise<AuthTokensDto> {
    const accessExpiresIn = this.configService.get<string>(
      "auth.jwt.accessExpiresIn",
      "15m",
    );
    const refreshExpiresIn = this.configService.get<string>(
      "auth.jwt.refreshExpiresIn",
      "7d",
    );
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.toLowerCase() as UserRole,
      type: "access",
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: randomUUID(),
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>("auth.jwt.accessSecret"),
        expiresIn: accessExpiresIn as JwtSignOptions["expiresIn"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>("auth.jwt.refreshSecret"),
        expiresIn: refreshExpiresIn as JwtSignOptions["expiresIn"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.durationToSeconds(accessExpiresIn),
    };
  }

  private async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        token,
        {
          secret: this.configService.getOrThrow<string>(
            "auth.jwt.refreshSecret",
          ),
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
      );
      if (payload.type !== "refresh" || !payload.sub || !payload.jti) {
        throw new Error("Unexpected JWT payload");
      }
      return payload;
    } catch {
      throw this.invalidRefreshToken();
    }
  }

  private async saveSession(
    userId: string,
    refreshToken: string,
    updateLastLogin: boolean,
  ): Promise<void> {
    const refreshTokenHash = await this.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        ...(updateLastLogin ? { lastLoginAt: new Date() } : {}),
      },
    });
  }

  private async hash(value: string): Promise<string> {
    const options = this.configService.get<{
      memoryCost: number;
      timeCost: number;
      parallelism: number;
    }>("auth.argon2");

    return argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: options?.memoryCost ?? 2 ** 16,
      timeCost: options?.timeCost ?? 3,
      parallelism: options?.parallelism ?? 1,
    });
  }

  private async verifyHash(hash: string, value: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, value);
    } catch {
      return false;
    }
  }

  private normalizePhone(value: string): string {
    const hasCountryPrefix = value.trim().startsWith("+");
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      throw new BadRequestException({
        code: "INVALID_PHONE",
        message: "Informe um telefone válido com DDD",
      });
    }
    return hasCountryPrefix ? `+${digits}` : digits;
  }

  private toPublicUser(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase() as UserRole,
      createdAt: user.createdAt,
    };
  }

  private throwDuplicateUser(
    user: Pick<User, "email" | "phone">,
    attemptedEmail: string,
  ): never {
    const isEmailDuplicate = user.email === attemptedEmail;
    throw new ConflictException({
      code: isEmailDuplicate ? "EMAIL_ALREADY_EXISTS" : "PHONE_ALREADY_EXISTS",
      message: isEmailDuplicate
        ? "Este e-mail já está cadastrado"
        : "Este telefone já está cadastrado",
    });
  }

  private invalidRefreshToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: "INVALID_REFRESH_TOKEN",
      message: "Sessão inválida ou expirada",
    });
  }

  private durationToSeconds(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value);
    if (!match) return 15 * 60;

    const amount = Number(match[1]);
    const factors = { s: 1, m: 60, h: 3600, d: 86400 } as const;
    return amount * factors[match[2] as keyof typeof factors];
  }
}
