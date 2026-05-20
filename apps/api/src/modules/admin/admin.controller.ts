import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put,
  Query, UseGuards, HttpCode,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { AdminProductsService, UpsertProductSchema, AddProductImageSchema, ReorderImagesSchema } from './admin-products.service'
import { CurrentUser, Roles } from '../auth/decorators'
import { RolesGuard } from '../auth/guards/roles.guard'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'

const ListQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

@ApiTags('admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(
    private readonly products: AdminProductsService,
    private readonly prisma: PrismaService
  ) {}

  // ── STATS ───────────────────────────────────────────────────────────────────

  @Get('stats')
  stats() {
    return this.products.stats()
  }

  // ── PRODUCTS ─────────────────────────────────────────────────────────────────

  @Get('products')
  list(@Query(new ZodValidationPipe(ListQuerySchema)) q: z.infer<typeof ListQuerySchema>) {
    return this.products.list(q)
  }

  @Get('products/:id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id)
  }

  @Post('products')
  @HttpCode(201)
  create(
    @Body(new ZodValidationPipe(UpsertProductSchema)) dto: z.infer<typeof UpsertProductSchema>,
    @CurrentUser() user: { id: string }
  ) {
    return this.products.create(dto, user.id)
  }

  @Put('products/:id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpsertProductSchema.partial())) dto: Partial<z.infer<typeof UpsertProductSchema>>,
    @CurrentUser() user: { id: string }
  ) {
    return this.products.update(id, dto, user.id)
  }

  @Delete('products/:id')
  @HttpCode(200)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.products.remove(id, user.id)
  }

  // ── IMAGES ───────────────────────────────────────────────────────────────────

  @Post('products/:id/images')
  @HttpCode(201)
  addImage(
    @Param('id') productId: string,
    @Body(new ZodValidationPipe(AddProductImageSchema)) dto: z.infer<typeof AddProductImageSchema>,
    @CurrentUser() user: { id: string }
  ) {
    return this.products.addImage(productId, dto, user.id)
  }

  @Delete('images/:id')
  @HttpCode(200)
  removeImage(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.products.removeImage(id, user.id)
  }

  @Patch('products/:id/images/reorder')
  reorderImages(
    @Param('id') productId: string,
    @Body(new ZodValidationPipe(ReorderImagesSchema)) body: z.infer<typeof ReorderImagesSchema>,
  ) {
    return this.products.reorderImages(productId, body.orderedIds)
  }

  // ── CATEGORIES ───────────────────────────────────────────────────────────────

  @Get('categories')
  listCategories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
  }

  @Post('categories')
  @HttpCode(201)
  createCategory(
    @Body() body: { name: string; slug: string; iconName?: string; parentId?: string },
    @CurrentUser() user: { id: string }
  ) {
    return this.prisma.category.create({
      data: {
        name: body.name, slug: body.slug,
        iconName: body.iconName, parentId: body.parentId,
        path: body.parentId ? `${body.parentId}/${body.slug}` : body.slug,
        depth: body.parentId ? 1 : 0,
        isActive: true,
      },
    })
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; iconName?: string; isActive?: boolean; sortOrder?: number }
  ) {
    return this.prisma.category.update({ where: { id }, data: body })
  }

  @Delete('categories/:id')
  @HttpCode(200)
  async deleteCategory(@Param('id') id: string) {
    const count = await this.prisma.product.count({ where: { categoryId: id, deletedAt: null } })
    if (count > 0) {
      return { ok: false, message: `Cannot delete — ${count} products still in this category` }
    }
    await this.prisma.category.delete({ where: { id } })
    return { ok: true }
  }
}
