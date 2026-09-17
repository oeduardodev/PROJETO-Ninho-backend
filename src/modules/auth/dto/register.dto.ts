import { Transform } from "class-transformer";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "ana@example.com" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "Informe um e-mail válido" })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "+5511999999999" })
  @IsString()
  @Matches(/^\+?[\d\s().-]{10,22}$/, {
    message: "Informe um telefone válido com DDD",
  })
  phone!: string;

  @ApiProperty({ example: "Senha123" })
  @IsString()
  @MinLength(8, { message: "A senha deve ter pelo menos 8 caracteres" })
  @MaxLength(128)
  @Matches(/[A-Za-zÀ-ÿ]/, { message: "A senha deve conter uma letra" })
  @Matches(/\d/, { message: "A senha deve conter um número" })
  password!: string;

  @ApiProperty({ example: "Senha123" })
  @IsString()
  @MaxLength(128)
  passwordConfirmation!: string;
}
