import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Usuario } from '../entities/usuario.entity';
import { LoginDto, RegisterDto, LoginResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, usuario.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último acceso
    await this.usuarioRepository.update(usuario.id, {
      ultimoAcceso: new Date(),
    });

    // Generar JWT
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<Usuario> {
    const { email, password, nombreCompleto, rol, activo } = registerDto;

    // Verificar si el email ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = this.usuarioRepository.create({
      nombreCompleto,
      email,
      password: hashedPassword,
      rol: rol || 'asistente_legal',
      activo: activo !== undefined ? activo : true,
    });

    return await this.usuarioRepository.save(usuario);
  }

  async getProfile(userId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      select: ['id', 'nombreCompleto', 'email', 'rol', 'activo', 'ultimoAcceso'],
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    return usuario;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email, activo: true },
    });

    if (usuario && (await bcrypt.compare(password, usuario.password))) {
      const { password, ...result } = usuario;
      return result;
    }

    return null;
  }

  // RECUPERAR CONTRASEÑA - Genera token y lo guarda en BD
  async recuperarContrasena(email: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
    });

    // Por seguridad, no revelamos si el email existe o no
    if (!usuario) {
      console.log(`Intento de recuperación con email no registrado: ${email}`);
      return;
    }

    // Generar token aleatorio
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Guardar token y fecha de expiración (1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.usuarioRepository.update(usuario.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expiresAt,
    });

    // Por ahora, solo mostramos el token en los logs para testing
    console.log('='.repeat(60));
    console.log('📧 EMAIL DE RECUPERACIÓN DE CONTRASEÑA');
    console.log('='.repeat(60));
    console.log(`Para: ${email}`);
    console.log(`Usuario: ${usuario.nombreCompleto}`);
    console.log(`Token: ${resetToken}`);
    console.log(`Expira: ${expiresAt.toLocaleString()}`);
    console.log(`Link: http://localhost:4200/auth/restablecer-contrasena?token=${resetToken}`);
    console.log('='.repeat(60));

    // TODO: Implementar envío de email real con nodemailer o servicio de email
  }

  // RESTABLECER CONTRASEÑA - Valida token y cambia contraseña
  async restablecerContrasena(token: string, nuevaContrasena: string): Promise<void> {
    // Buscar usuarios con token de reset válido
    const usuarios = await this.usuarioRepository.find({
      where: { activo: true },
    });

    let usuarioValido: Usuario | null = null;

    // Verificar el token contra todos los usuarios (porque está hasheado)
    for (const usuario of usuarios) {
      if (usuario.resetPasswordToken && usuario.resetPasswordExpires) {
        const isTokenValid = await bcrypt.compare(token, usuario.resetPasswordToken);
        const isNotExpired = new Date() < usuario.resetPasswordExpires;

        if (isTokenValid && isNotExpired) {
          usuarioValido = usuario;
          break;
        }
      }
    }

    if (!usuarioValido) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña y limpiar token
    await this.usuarioRepository.update(usuarioValido.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    console.log(`✅ Contraseña restablecida exitosamente para: ${usuarioValido.email}`);
  }
}