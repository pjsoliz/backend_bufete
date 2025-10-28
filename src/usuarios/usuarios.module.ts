import { Injectable, NotFoundException, ConflictException, Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IsNotEmpty, IsString, IsEmail, IsBoolean, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../entities/usuario.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { AuthModule } from '../auth/auth.module';

// DTOs
export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreCompleto: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(['admin', 'asistente_legal'])
  @IsOptional()
  rol?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombreCompleto?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsEnum(['admin', 'asistente_legal'])
  @IsOptional()
  rol?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

// Service
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Verificar si el email ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      password: hashedPassword,
      rol: createUsuarioDto.rol || 'asistente_legal',
      activo: createUsuarioDto.activo !== undefined ? createUsuarioDto.activo : true,
    });

    return await this.usuarioRepository.save(usuario);
  }

  async findAll(activo?: boolean, busqueda?: string): Promise<Usuario[]> {
    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo;
    }

    if (busqueda) {
      return await this.usuarioRepository.find({
        where: [
          { ...where, nombreCompleto: Like(`%${busqueda}%`) },
          { ...where, email: Like(`%${busqueda}%`) },
        ],
        select: ['id', 'nombreCompleto', 'email', 'rol', 'activo', 'ultimoAcceso', 'createdAt'],
        order: { nombreCompleto: 'ASC' },
      });
    }

    return await this.usuarioRepository.find({
      where,
      select: ['id', 'nombreCompleto', 'email', 'rol', 'activo', 'ultimoAcceso', 'createdAt'],
      order: { nombreCompleto: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      select: ['id', 'nombreCompleto', 'email', 'rol', 'activo', 'ultimoAcceso', 'createdAt'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    await this.findOne(id);

    // Si se actualiza la contraseña, hashearla
    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, 10);
    }

    // Si se actualiza el email, verificar que no exista
    if (updateUsuarioDto.email) {
      const existingUser = await this.usuarioRepository.findOne({
        where: { email: updateUsuarioDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    await this.usuarioRepository.remove(usuario);
    return { message: 'Usuario eliminado exitosamente' };
  }
}

// Controller
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async create(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  async findAll(
    @Query('activo') activo?: string,
    @Query('busqueda') busqueda?: string,
  ): Promise<Usuario[]> {
    const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.usuariosService.findAll(activoBool, busqueda);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Usuario> {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usuariosService.remove(id);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), AuthModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
