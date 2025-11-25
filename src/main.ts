import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ⭐ CONFIGURACIÓN DE SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Bufete Genesis API')
    .setDescription('API para sistema de gestión de citas del Bufete Genesis Integrales')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y autorización')
    .addTag('citas', 'Gestión de citas')
    .addTag('clientes', 'Gestión de clientes')
    .addTag('abogados', 'Gestión de abogados')
    .addTag('reportes', 'Reportes y estadísticas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // ⭐ FIN CONFIGURACIÓN

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Servidor corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();