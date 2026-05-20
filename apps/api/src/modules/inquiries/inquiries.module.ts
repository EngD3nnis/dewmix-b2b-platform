import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'

import { CreateInquirySchema, type CreateInquiryDto } from '@dewmix/types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { Public, Roles } from '../auth/decorators'
import { RolesGuard } from '../auth/guards/roles.guard'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { InquiriesService } from './inquiries.service'

// ── Public: storefront submits here when the customer taps "Send via WhatsApp" ──

@ApiTags('inquiries')
@Controller({ path: 'inquiries', version: '1' })
export class InquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Public()
  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(CreateInquirySchema)) dto: CreateInquiryDto) {
    return this.inquiries.create(dto)
  }
}

// ── Admin: list, view, and update inquiry status ──
// Pure CRUD with no side-effect business logic, so the prisma calls stay inline.

const AdminListQuery = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

const UpdateStatus = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST']),
})

@ApiTags('admin')
@Controller({ path: 'admin/inquiries', version: '1' })
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminInquiriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(AdminListQuery))
    q: z.infer<typeof AdminListQuery>,
  ) {
    const where = q.status ? { status: q.status } : {}
    const [items, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.prisma.inquiry.count({ where }),
    ])
    return {
      items,
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize) || 1,
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.inquiry.findUnique({ where: { id } })
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStatus)) body: z.infer<typeof UpdateStatus>,
  ) {
    return this.prisma.inquiry.update({
      where: { id },
      data: { status: body.status },
    })
  }
}

@Module({
  imports: [NotificationsModule],
  controllers: [InquiriesController, AdminInquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
