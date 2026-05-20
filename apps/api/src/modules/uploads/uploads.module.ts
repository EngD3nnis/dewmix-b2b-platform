import {
  Body,
  Controller,
  Injectable,
  Logger,
  Module,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import * as crypto from 'node:crypto'

import {
  PresignUploadSchema,
  type PresignUploadDto,
  MIME_TO_EXT,
} from '@dewmix/types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { Roles } from '../auth/decorators'
import { RolesGuard } from '../auth/guards/roles.guard'

/**
 * Generates AWS Signature V4 presigned PUT URLs for direct-to-S3 uploads.
 *
 * Why hand-rolled and not @aws-sdk/s3-request-presigner? Two reasons:
 *   1) Zero runtime deps — the SDK pulls in ~2MB of code we'd use for one call.
 *   2) Works against any S3-compatible store (MinIO local, Cloudflare R2 prod,
 *      AWS S3) without per-provider quirks. The signing math is the same.
 *
 * The signed URL binds the upload to a specific `Content-Type` (it's in the
 * signed headers), so a client cannot upload `application/x-msdownload` using
 * a URL signed for `image/jpeg`. The extension on the S3 key is derived from
 * the validated MIME, never from the user-supplied filename — `evil.exe` in
 * the request body becomes `*.jpg` on disk if the contentType says jpeg.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name)

  async getPresignedUrl(
    dto: PresignUploadDto,
  ): Promise<{ url: string; publicUrl: string; key: string; expiresIn: number }> {
    // Extension comes from the validated MIME, NEVER from the filename. If
    // someone sends { filename: "..jpg", contentType: "image/png" } the file
    // lands as ".png" — the contentType wins because that's what the bucket
    // sees and serves.
    const ext = MIME_TO_EXT[dto.contentType]

    // Namespace: products/{productId}/{rand}.ext when we know which product,
    // else products/_unbound/{rand}.ext. The _unbound prefix lets a future
    // cleanup job find orphaned uploads cheaply.
    const namespace = dto.productId
      ? `products/${dto.productId}`
      : 'products/_unbound'
    const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const key = `${namespace}/${unique}.${ext}`

    const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000'
    const bucket = process.env.S3_BUCKET ?? 'dewmix-images'
    const publicBase = process.env.S3_PUBLIC_URL ?? `${endpoint}/${bucket}`
    const publicUrl = `${publicBase}/${key}`

    const accessKey = process.env.S3_ACCESS_KEY ?? 'dewmix'
    const secretKey = process.env.S3_SECRET_KEY ?? 'dewmix-secret'
    const region = process.env.S3_REGION ?? 'us-east-1'
    const host = endpoint.replace(/^https?:\/\//, '')
    const expiresIn = 300 // 5 minute upload window — short by design

    // ── AWS Signature V4 for presigned PUT ────────────────────────────────────
    const now = new Date()
    const datestamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timestamp = now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
    const scope = `${datestamp}/${region}/s3/aws4_request`
    const canonicalUri = `/${bucket}/${key}`

    const queryParams = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${accessKey}/${scope}`,
      'X-Amz-Date': timestamp,
      'X-Amz-Expires': String(expiresIn),
      'X-Amz-SignedHeaders': 'content-type;host',
    })
    queryParams.sort()

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      queryParams.toString(),
      `content-type:${dto.contentType}\nhost:${host}\n`,
      'content-type;host',
      'UNSIGNED-PAYLOAD',
    ].join('\n')

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      scope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const sign = (k: Buffer, data: string) =>
      crypto.createHmac('sha256', k).update(data).digest()
    const signingKey = sign(
      sign(sign(sign(Buffer.from(`AWS4${secretKey}`), datestamp), region), 's3'),
      'aws4_request',
    )
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex')
    queryParams.append('X-Amz-Signature', signature)

    const url = `${endpoint}/${bucket}/${key}?${queryParams.toString()}`

    this.logger.log(
      `Presigned PUT issued for ${key} (${dto.contentType}); expires in ${expiresIn}s`,
    )
    return { url, publicUrl, key, expiresIn }
  }
}

@ApiTags('uploads')
@Controller({ path: 'uploads', version: '1' })
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('presign')
  presign(
    @Body(new ZodValidationPipe(PresignUploadSchema)) dto: PresignUploadDto,
  ) {
    return this.service.getPresignedUrl(dto)
  }
}

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
