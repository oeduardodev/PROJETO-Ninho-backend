import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class ForgotPasswordDto {
  @ApiProperty({ example: "ana@example.com" })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "Informe um e-mail válido" })
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "ana@example.com" })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "Informe um e-mail válido" })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "123456" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @Matches(/^\d{6}$/, { message: "Informe o código de 6 dígitos" })
  code!: string;

  @ApiProperty({ example: "Senha123" })
  @IsString()
  @MinLength(8, { message: "A senha deve ter pelo menos 8 caracteres" })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: "A senha deve conter uma letra" })
  @Matches(/\d/, { message: "A senha deve conter um número" })
  password!: string;

  @ApiProperty({ example: "Senha123" })
  @IsString()
  @MaxLength(128)
  passwordConfirmation!: string;
}

export class PasswordResetRequestedDto {
  @ApiProperty({
    example: "Se este e-mail estiver cadastrado, enviaremos um código.",
  })
  message!: string;

  @ApiPropertyOptional({
    description:
      "Código de recuperação. Retornado apenas em ambientes que não são de produção.",
  })
  devCode?: string;
}

export class PasswordResetCompletedDto {
  @ApiProperty({ example: "Senha atualizada com sucesso." })
  message!: string;
}
