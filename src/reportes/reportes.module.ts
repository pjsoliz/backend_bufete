import { Injectable, Controller, Get, UseGuards, Query, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cita } from '../entities/cita.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

// Service
@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Cita)
    private citaRepository: Repository<Cita>,
  ) {}

  async getCasosMasSolicitados(mes?: number, anio?: number): Promise<any[]> {
    const query = this.citaRepository
      .createQueryBuilder('cita')
      .select('tc.nombre', 'tipoCaso')
      .addSelect('COUNT(cita.id)', 'total')
      .leftJoin('cita.tipoCaso', 'tc')
      .groupBy('tc.nombre')
      .orderBy('total', 'DESC')
      .limit(10);

    if (mes && anio) {
      query.andWhere('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes });
      query.andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio });
    }

    return await query.getRawMany();
  }

  async getAbogadosMasSolicitados(mes?: number, anio?: number): Promise<any[]> {
    const query = this.citaRepository
      .createQueryBuilder('cita')
      .select('a.nombre', 'abogado')
      .addSelect('COUNT(cita.id)', 'total')
      .leftJoin('cita.abogado', 'a')
      .groupBy('a.nombre')
      .orderBy('total', 'DESC')
      .limit(10);

    if (mes && anio) {
      query.andWhere('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes });
      query.andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio });
    }

    return await query.getRawMany();
  }

  async getEstadisticasMes(mes: number, anio: number): Promise<any> {
    const totalCitas = await this.citaRepository
      .createQueryBuilder('cita')
      .where('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes })
      .andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio })
      .getCount();

    const citasPorEstado = await this.citaRepository
      .createQueryBuilder('cita')
      .select('cita.estado', 'estado')
      .addSelect('COUNT(cita.id)', 'total')
      .where('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes })
      .andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio })
      .groupBy('cita.estado')
      .getRawMany();

    const citasPorOrigen = await this.citaRepository
      .createQueryBuilder('cita')
      .select('cita.origen', 'origen')
      .addSelect('COUNT(cita.id)', 'total')
      .where('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes })
      .andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio })
      .groupBy('cita.origen')
      .getRawMany();

    const citasPorUrgencia = await this.citaRepository
      .createQueryBuilder('cita')
      .select('cita.urgencia', 'urgencia')
      .addSelect('COUNT(cita.id)', 'total')
      .where('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes })
      .andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio })
      .groupBy('cita.urgencia')
      .getRawMany();

    return {
      mes,
      anio,
      totalCitas,
      citasPorEstado,
      citasPorOrigen,
      citasPorUrgencia,
    };
  }

  async getAreasMasSolicitadas(mes?: number, anio?: number): Promise<any[]> {
    const query = this.citaRepository
      .createQueryBuilder('cita')
      .select('ad.nombre', 'areaDerecho')
      .addSelect('COUNT(cita.id)', 'total')
      .leftJoin('cita.areaDerecho', 'ad')
      .groupBy('ad.nombre')
      .orderBy('total', 'DESC')
      .limit(10);

    if (mes && anio) {
      query.andWhere('EXTRACT(MONTH FROM cita.fecha) = :mes', { mes });
      query.andWhere('EXTRACT(YEAR FROM cita.fecha) = :anio', { anio });
    }

    return await query.getRawMany();
  }
}

// Controller
@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('casos-mas-solicitados')
  async getCasosMasSolicitados(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ): Promise<any[]> {
    const mesNum = mes ? parseInt(mes) : undefined;
    const anioNum = anio ? parseInt(anio) : undefined;
    return this.reportesService.getCasosMasSolicitados(mesNum, anioNum);
  }

  @Get('abogados-mas-solicitados')
  async getAbogadosMasSolicitados(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ): Promise<any[]> {
    const mesNum = mes ? parseInt(mes) : undefined;
    const anioNum = anio ? parseInt(anio) : undefined;
    return this.reportesService.getAbogadosMasSolicitados(mesNum, anioNum);
  }

  @Get('estadisticas-mes')
  async getEstadisticasMes(
    @Query('mes') mes: string,
    @Query('anio') anio: string,
  ): Promise<any> {
    const mesNum = parseInt(mes) || new Date().getMonth() + 1;
    const anioNum = parseInt(anio) || new Date().getFullYear();
    return this.reportesService.getEstadisticasMes(mesNum, anioNum);
  }

  @Get('areas-mas-solicitadas')
  async getAreasMasSolicitadas(
    @Query('mes') mes?: string,
    @Query('anio') anio?: string,
  ): Promise<any[]> {
    const mesNum = mes ? parseInt(mes) : undefined;
    const anioNum = anio ? parseInt(anio) : undefined;
    return this.reportesService.getAreasMasSolicitadas(mesNum, anioNum);
  }
}

// Module
@Module({
  imports: [TypeOrmModule.forFeature([Cita]), AuthModule],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
