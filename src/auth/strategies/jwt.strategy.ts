import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { sub: id } = payload;

    const usuario = await this.usuarioRepository.findOne({
      where: { id, activo: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    // Actualizar último acceso
    await this.usuarioRepository.update(id, {
      ultimoAcceso: new Date(),
    });

    return {
      id: usuario.id,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
    };
  }
}
