import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
}
