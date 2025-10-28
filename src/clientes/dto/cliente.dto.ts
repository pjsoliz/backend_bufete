import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @MaxLength(255)
  nombreCompleto: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  email?: string;

  @IsEnum(['telegram', 'whatsapp', 'panel_web'], {
    message: 'La plataforma debe ser: telegram, whatsapp o panel_web',
  })
  @IsOptional()
  plataforma?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  userIdPlataforma?: string;
}

export class UpdateClienteDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombreCompleto?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(['telegram', 'whatsapp', 'panel_web'])
  @IsOptional()
  plataforma?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  userIdPlataforma?: string;
}
