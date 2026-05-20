import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards, UsePipes } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { RequestOtpSchema, VerifyOtpSchema, type RequestOtpDto, type VerifyOtpDto } from '@dewmix/types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { AuthService, type TokenPair } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser, Public } from './decorators'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.COOKIE_SECURE === 'true',
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
}

const ACCESS_COOKIE = 'dewmix_access'
const REFRESH_COOKIE = 'dewmix_refresh'

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
  ) {}

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(RequestOtpSchema))
  request(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto)
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  async verify(
    @Body(new ZodValidationPipe(VerifyOtpSchema)) dto: VerifyOtpDto,
    @Req() _req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.verifyOtp(dto)
    this.setAuthCookies(res, result.tokens)
    return { user: result.user }
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) {
      res.status(401)
      return { message: 'No refresh token' }
    }
    const tokens = await this.auth.refresh(token)
    this.setAuthCookies(res, tokens)
    return { ok: true }
  }

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id)
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE, COOKIE_OPTIONS)
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS)
    return { ok: true }
  }

  private setAuthCookies(res: Response, tokens: TokenPair) {
    const accessMaxAge = 15 * 60 * 1000 // 15 min
    const refreshMaxAge = 30 * 24 * 60 * 60 * 1000 // 30 days

    res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: accessMaxAge })
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: refreshMaxAge })
  }
}
