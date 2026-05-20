import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard'
import { ROLES_KEY } from '../guards/roles.guard'

/** Mark a route as public (skip auth). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

/** Require specific roles to access a route. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

/** Inject the current authenticated user into a controller method. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.user as { id: string; role: string; phone: string }
})
