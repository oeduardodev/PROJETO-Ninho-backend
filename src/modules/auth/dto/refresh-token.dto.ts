import { IsJWT, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token recebido no login ou cadastro" })
  @IsString()
  @IsJWT({ message: "Refresh token inválido" })
  refreshToken!: string;
}
