import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { User, UserRole as PrismaUserRole } from "@prisma/client";
import * as argon2 from "argon2";

import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { AuthService } from "./auth.service";

jest.mock("argon2", () => ({
  argon2id: 2,
  hash: jest.fn().mockResolvedValue("hashed-value"),
  verify: jest.fn().mockResolvedValue(true),
}));

const user: User = {
  id: "4d34f224-bf4a-41c5-9de1-7497cab1f1fd",
  email: "ana@example.com",
  phone: "+5511999999999",
  passwordHash: "hashed-password",
  refreshTokenHash: "hashed-refresh-token",
  role: PrismaUserRole.USER,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date("2026-09-08T12:00:00.000Z"),
  updatedAt: new Date("2026-09-08T12:00:00.000Z"),
  communityName: null,
  communityHandle: null,
  avatarEmoji: null,
  avatarBg: null,
};

describe("AuthService", () => {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string, fallback?: unknown) => {
      const values: Record<string, unknown> = {
        "auth.jwt.accessExpiresIn": "15m",
        "auth.jwt.refreshExpiresIn": "7d",
        "auth.argon2": { memoryCost: 1024, timeCost: 1, parallelism: 1 },
      };
      return values[key] ?? fallback;
    }),
    getOrThrow: jest.fn((key: string) => `${key}-for-tests`),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it("cadastra o usuário e nunca persiste a senha em texto puro", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);
    jwtService.signAsync
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token");

    const result = await service.register({
      email: "ANA@example.com ",
      phone: "+55 (11) 99999-9999",
      password: "Senha123",
      passwordConfirmation: "Senha123",
    });

    expect(argon2.hash).toHaveBeenCalledWith(
      "Senha123",
      expect.objectContaining({ type: argon2.argon2id }),
    );
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        email: "ana@example.com",
        phone: "+5511999999999",
        passwordHash: "hashed-value",
        refreshTokenHash: "hashed-value",
        lastLoginAt: expect.any(Date),
      },
    });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.tokens.accessToken).toBe("access-token");
  });

  it("rejeita confirmação de senha divergente", async () => {
    await expect(
      service.register({
        email: "ana@example.com",
        phone: "11999999999",
        password: "Senha123",
        passwordConfirmation: "Outra123",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejeita e-mail já cadastrado", async () => {
    prisma.user.findFirst.mockResolvedValue({
      email: user.email,
      phone: user.phone,
    });

    await expect(
      service.register({
        email: user.email,
        phone: "11988888888",
        password: "Senha123",
        passwordConfirmation: "Senha123",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("não informa se foi o e-mail ou a senha que falhou no login", async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

    await expect(
      service.login({ email: user.email, password: "senha-errada" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rotaciona refresh token válido", async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);
    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      jti: "token-id",
      type: "refresh",
    });
    jwtService.signAsync
      .mockResolvedValueOnce("new-access-token")
      .mockResolvedValueOnce("new-refresh-token");

    const result = await service.refresh("old.refresh.token");

    expect(argon2.verify).toHaveBeenCalledWith(
      user.refreshTokenHash,
      "old.refresh.token",
    );
    expect(result.tokens.refreshToken).toBe("new-refresh-token");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({ refreshTokenHash: "hashed-value" }),
      }),
    );
  });
});
