import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  nombreCompleto: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsEnum(['admin', 'asistente_legal'], { message: 'El rol debe ser admin o asistente_legal' })
  @IsOptional()
  rol?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class LoginResponseDto {
  access_token: string;
  user: {
    id: string;
    nombreCompleto: string;
    email: string;
    rol: string;
  };
}
