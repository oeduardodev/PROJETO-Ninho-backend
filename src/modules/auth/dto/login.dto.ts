import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "ana@example.com" })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: "Informe um e-mail válido" })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: "Senha123" })
  @IsString()
  @MaxLength(128)
  password!: string;
}
