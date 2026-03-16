import { IsNotEmpty, IsUUID, IsString, IsEnum, IsOptional, Matches } from 'class-validator';

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
@IsOptional()
tipoCitaId?: string;

  @IsUUID('4', { message: 'El ID de la oficina debe ser un UUID válido' })
@IsOptional()
oficinaId?: string;

  @IsString({ message: 'La fecha debe ser un string' })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  fecha: string;

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
  @IsOptional()
  origen?: string;

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

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  fecha?: string;

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
  origen: 'chatbot';
}

export class FilterCitasDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaFin?: string;

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
  busqueda?: string;

  @IsOptional()
  @IsEnum(['chatbot', 'panel_web', 'presencial'])
  origen?: string;

  @IsOptional()
  @IsEnum(['alta', 'media', 'baja'])
  urgencia?: string;
}

export class VerificarClienteAgenteDto {
  @IsString()
  @IsNotEmpty()
  user_id_plataforma: string;

  @IsString()
  @IsNotEmpty()
  plataforma: string;
}

export class CrearCitaAgenteDto {
  @IsString()
  @IsNotEmpty()
  user_id_plataforma: string;

  @IsString()
  @IsNotEmpty()
  plataforma: string;

  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsEnum(['alta', 'media', 'baja'])
  urgencia: 'alta' | 'media' | 'baja';

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  hora: string;
}

export class ConsultarDisponibilidadDto {
  @IsString()
  @IsNotEmpty()
  especialidad: string;

  @IsEnum(['alta', 'media', 'baja'])
  urgencia: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha_deseada?: string;
}