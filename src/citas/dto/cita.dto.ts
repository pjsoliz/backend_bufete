import { IsNotEmpty, IsUUID, IsString, IsDate, IsEnum, IsOptional, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCitaDto {
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El cliente es requerido' })
  clienteId: string;

  @IsUUID('4', { message: 'El ID del abogado debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El abogado es requerido' })
  abogadoId: string;

  @IsUUID('4', { message: 'El ID del área de derecho debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El área de derecho es requerida' })
  areaDerechoId: string;

  @IsUUID('4', { message: 'El ID del tipo de caso debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El tipo de caso es requerido' })
  tipoCasoId: string;

  @IsUUID('4', { message: 'El ID del tipo de cita debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El tipo de cita es requerido' })
  tipoCitaId: string;

  @IsUUID('4', { message: 'El ID de la oficina debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La oficina es requerida' })
  oficinaId: string;

  @Type(() => Date)
  @IsDate({ message: 'La fecha debe ser válida' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: Date;

  @IsString()
  @IsNotEmpty({ message: 'La hora es requerida' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora debe estar en formato HH:MM' })
  hora: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  notasAdicionales?: string;

  @IsEnum(['alta', 'media', 'baja'], { message: 'La urgencia debe ser: alta, media o baja' })
  @IsOptional()
  urgencia?: string;

  @IsEnum(['chatbot', 'panel_web', 'presencial'], { message: 'El origen debe ser: chatbot, panel_web o presencial' })
  @IsNotEmpty({ message: 'El origen es requerido' })
  origen: string;

  @IsString()
  @IsOptional()
  telefonoContacto?: string;

  @IsUUID('4')
  @IsOptional()
  creadoPorUsuarioId?: string;
}

export class UpdateCitaDto {
  @IsUUID('4')
  @IsOptional()
  abogadoId?: string;

  @IsUUID('4')
  @IsOptional()
  areaDerechoId?: string;

  @IsUUID('4')
  @IsOptional()
  tipoCasoId?: string;

  @IsUUID('4')
  @IsOptional()
  tipoCitaId?: string;

  @IsUUID('4')
  @IsOptional()
  oficinaId?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  fecha?: Date;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  hora?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  notasAdicionales?: string;

  @IsEnum(['alta', 'media', 'baja'])
  @IsOptional()
  urgencia?: string;

  @IsString()
  @IsOptional()
  telefonoContacto?: string;
}

export class UpdateEstadoCitaDto {
  @IsEnum(['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'], {
    message: 'El estado debe ser: pendiente, confirmada, completada, cancelada o no_asistio',
  })
  @IsNotEmpty({ message: 'El estado es requerido' })
  estado: string;

  @IsString()
  @IsOptional()
  motivoCancelacion?: string;
}

export class CreateCitaChatbotDto extends CreateCitaDto {
  // DTO específico para el endpoint del chatbot
  // Hereda todo de CreateCitaDto pero origen ya está fijado como 'chatbot'
  origen: 'chatbot';
}

export class FilterCitasDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaFin?: Date;

  @IsOptional()
  @IsEnum(['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'])
  estado?: string;

  @IsOptional()
  @IsUUID('4')
  abogadoId?: string;

  @IsOptional()
  @IsUUID('4')
  clienteId?: string;

  @IsOptional()
  @IsString()
  busqueda?: string; // Para buscar por nombre de cliente o abogado

  @IsOptional()
  @IsEnum(['chatbot', 'panel_web', 'presencial'])
  origen?: string;

  @IsOptional()
  @IsEnum(['alta', 'media', 'baja'])
  urgencia?: string;
}
