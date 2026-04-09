import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, LoginResponseDto, RecuperarContrasenaDto, RestablecerContrasenaDto } from './dto/auth.dto';
import { Public, CurrentUser, Roles } from './decorators/auth.decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Usuario } from '../entities/usuario.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string; usuario: Usuario }> {
    const usuario = await this.authService.register(registerDto);
    return {
      message: 'Usuario registrado exitosamente',
      usuario,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any): Promise<Usuario> {
    return this.authService.getProfile(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    // El logout se maneja en el frontend eliminando el token
    return { message: 'Logout exitoso' };
  }

  
  @Public()
  @Post('recuperar-contrasena')
  @HttpCode(HttpStatus.OK)
  async recuperarContrasena(@Body() dto: RecuperarContrasenaDto): Promise<{ message: string }> {
    await this.authService.recuperarContrasena(dto.email);
    return { 
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña' 
    };
  }

  @Public()
  @Post('restablecer-contrasena')
  @HttpCode(HttpStatus.OK)
  async restablecerContrasena(@Body() dto: RestablecerContrasenaDto): Promise<{ message: string }> {
    await this.authService.restablecerContrasena(dto.token, dto.nuevaContrasena);
    return { 
      message: 'Contraseña restablecida exitosamente' 
    };
  }
}