import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbogadosService } from './abogados.service';
import { AbogadosController } from './abogados.controller';
import { Abogado } from '../entities/abogado.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Abogado]), AuthModule],
  controllers: [AbogadosController],
  providers: [AbogadosService],
  exports: [AbogadosService],
})
export class AbogadosModule {}
