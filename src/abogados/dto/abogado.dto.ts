import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID, IsBoolean, IsEnum, MaxLength } from 'class-validator';

export class CreateAbogadoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(255)
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  especialidad?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsUUID('4')
  @IsOptional()
  oficinaId?: string;

  @IsEnum(['telegram', 'whatsapp'])
  @IsOptional()
  plataformaNotificacion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  userIdTelegram?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numeroWhatsapp?: string;

  @IsBoolean()
  @IsOptional()
  recibirNotificaciones?: boolean;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateAbogadoDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  especialidad?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @IsUUID('4')
  @IsOptional()
  oficinaId?: string;

  @IsEnum(['telegram', 'whatsapp'])
  @IsOptional()
  plataformaNotificacion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  userIdTelegram?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  numeroWhatsapp?: string;

  @IsBoolean()
  @IsOptional()
  recibirNotificaciones?: boolean;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
