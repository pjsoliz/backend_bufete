import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

// Config
import { getDatabaseConfig } from './config/database.config';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ClientesModule } from './clientes/clientes.module';
import { AbogadosModule } from './abogados/abogados.module';
import { CitasModule } from './citas/citas.module';
import { OficinasModule } from './oficinas/oficinas.module';
import { AreasDerechoModule } from './areas-derecho/areas-derecho.module';
import { TiposCasoModule } from './tipos-caso/tipos-caso.module';
import { TiposCitaModule } from './tipos-cita/tipos-cita.module';
import { ReportesModule } from './reportes/reportes.module';

// Guards
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM con configuración de base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Módulos de la aplicación
    AuthModule,
    UsuariosModule,
    ClientesModule,
    AbogadosModule,
    CitasModule,
    OficinasModule,
    AreasDerechoModule,
    TiposCasoModule,
    TiposCitaModule,
    ReportesModule,
  ],
  providers: [
    // Guards globales
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
