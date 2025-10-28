import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Decorador para marcar rutas como públicas
export const Public = () => SetMetadata('isPublic', true);

// Decorador para especificar roles requeridos
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Decorador para obtener el usuario actual
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
