import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { Request } from 'express'

export interface JwtPayload {
  sub: string
  role: string
  phone: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

const cookieExtractor = (req: Request): string | null => {
  return req?.cookies?.['dewmix_access'] ?? null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Cookie first, Authorization header as fallback (mobile/native clients)
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    })
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Wrong token type')
    }
    return { id: payload.sub, role: payload.role, phone: payload.phone }
  }
}
