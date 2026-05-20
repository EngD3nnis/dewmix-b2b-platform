import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as argon2 from 'argon2'
import { randomInt } from 'node:crypto'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { SMS_PROVIDER, type SmsProvider } from '../../infrastructure/sms/sms.interface'
import type { RequestOtpDto, VerifyOtpDto } from '@dewmix/types'

const OTP_LENGTH = 6
const OTP_TTL_SECONDS = 5 * 60 // 5 minutes
const OTP_MAX_ATTEMPTS = 5
const OTP_RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute between OTP requests per phone

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider
  ) {}

  /**
   * Request an OTP for a phone number.
   * Creates the user if they don't exist (passwordless flow).
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; devCode?: string }> {
    // Rate limit: max 1 OTP per phone per minute
    const recent = await this.prisma.otpRequest.findFirst({
      where: {
        phone: dto.phone,
        purpose: dto.purpose,
        createdAt: { gte: new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS) },
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recent) {
      throw new TooManyRequestsException('Please wait a moment before requesting another code')
    }

    // Find or create user (passwordless signup)
    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: { phone: dto.phone, role: 'CUSTOMER', status: 'PENDING_VERIFICATION' },
      update: {},
    })

    // Generate cryptographically random 6-digit code
    const code = String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, '0')
    const codeHash = await argon2.hash(code)
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000)

    await this.prisma.otpRequest.create({
      data: {
        userId: user.id,
        phone: dto.phone,
        codeHash,
        purpose: dto.purpose,
        expiresAt,
      },
    })

    // Send SMS
    const message = `Your Dewmix code is ${code}. Valid for 5 minutes. Do not share.`
    const result = await this.sms.send(dto.phone, message)

    if (result.status === 'failed') {
      this.logger.error(`SMS send failed for ${dto.phone}: ${result.error}`)
      throw new BadRequestException("We couldn't send your code. Please try again.")
    }

    return {
      message: 'Code sent. Check your phone.',
      // Dev convenience only — never expose in production
      ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
    }
  }

  /**
   * Verify an OTP and issue tokens.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{ user: { id: string; phone: string; role: string }; tokens: TokenPair }> {
    const otp = await this.prisma.otpRequest.findFirst({
      where: { phone: dto.phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      throw new UnauthorizedException('Code expired or not found. Request a new one.')
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new TooManyRequestsException('Too many attempts. Request a new code.')
    }

    const valid = await argon2.verify(otp.codeHash, dto.code)

    if (!valid) {
      await this.prisma.otpRequest.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      })
      throw new UnauthorizedException('Invalid code')
    }

    // Consume the OTP — never reusable
    await this.prisma.otpRequest.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    })

    // Mark phone as verified and ensure user is active
    const user = await this.prisma.user.update({
      where: { phone: dto.phone },
      data: {
        phoneVerified: new Date(),
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      },
    })

    const tokens = await this.issueTokens(user.id, user.role, user.phone ?? '')

    return {
      user: { id: user.id, phone: user.phone ?? '', role: user.role },
      tokens,
    }
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; role: string; phone: string; type: string }
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Wrong token type')
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('User not found or inactive')
    }

    return this.issueTokens(user.id, user.role, user.phone ?? '')
  }

  /**
   * Return the currently authenticated user's profile.
   */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })
    if (!user) throw new UnauthorizedException('User not found')
    return user
  }

  private async issueTokens(userId: string, role: string, phone: string): Promise<TokenPair> {
    const basePayload = { sub: userId, role, phone }
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...basePayload, type: 'access' },
        { expiresIn: process.env.JWT_ACCESS_EXPIRY ?? '15m' }
      ),
      this.jwt.signAsync(
        { ...basePayload, type: 'refresh' },
        { expiresIn: process.env.JWT_REFRESH_EXPIRY ?? '30d' }
      ),
    ])
    return { accessToken, refreshToken }
  }
}
