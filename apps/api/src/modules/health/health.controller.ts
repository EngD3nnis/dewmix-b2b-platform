import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { Public } from '../auth/decorators'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    let db = 'up'
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      db = 'down'
    }
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: { db },
      service: 'dewmix-api',
      version: process.env.npm_package_version ?? '0.1.0',
    }
  }
}
