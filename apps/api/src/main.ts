import 'reflect-metadata'
// Validate env before any module loads. Throws and exits the process on a
// misconfigured or production-unsafe environment (see ./env.ts for rules).
import './env'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger as PinoLogger } from 'nestjs-pino'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(PinoLogger))

  // Security
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(cookieParser())
  app.enableCors({
    origin: [process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'],
    credentials: true,
  })

  // API conventions
  app.setGlobalPrefix('api', { exclude: ['health', 'docs'] })
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))

  app.enableShutdownHooks()

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Dewmix Hardware API')
    .setDescription('REST API for the Dewmix Hardware commerce platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Dewmix API Docs',
  })

  const port = Number(process.env.API_PORT ?? 4000)
  await app.listen(port, '0.0.0.0')

  // eslint-disable-next-line no-console
  console.log(`\n  🛠   Dewmix API running on http://localhost:${port}`)
  console.log(`  📚  Swagger docs at http://localhost:${port}/docs\n`)
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
