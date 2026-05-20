import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { z } from 'zod'

export const UpsertProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).optional(),
  sku: z.string().min(1).max(100),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  specs: z.record(z.string(), z.string()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).default('ACTIVE'),
  isFeatured: z.boolean().default(false),
  minOrderQty: z.number().int().min(1).default(1),
  weightGrams: z.number().int().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  // Inventory
  quantity: z.number().int().min(0).default(0),
})
export type UpsertProductDto = z.infer<typeof UpsertProductSchema>

export const AddProductImageSchema = z.object({
  url: z.string().url().max(2048),
  alt: z.string().max(200).optional(),
  /** Pixel dimensions captured client-side before upload. Optional —
   *  next/image still works without them, but providing them avoids CLS. */
  width: z.number().int().min(1).max(20000).optional(),
  height: z.number().int().min(1).max(20000).optional(),
  /** Base64 LQIP for next/image's `placeholder="blur"`. ~30 chars typical. */
  blurDataUrl: z.string().max(8000).optional(),
})
export type AddProductImageDto = z.infer<typeof AddProductImageSchema>

export const ReorderImagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(50),
})
export type ReorderImagesDto = z.infer<typeof ReorderImagesSchema>

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { q?: string; categoryId?: string; status?: string; page: number; pageSize: number }) {
    const where = {
      deletedAt: null,
      ...(opts.q ? { name: { contains: opts.q, mode: 'insensitive' as const } } : {}),
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.status ? { status: opts.status as never } : {}),
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where, skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          inventory: { select: { quantity: true, reserved: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ])
    return {
      items: items.map((p) => ({
        ...p,
        inStock: p.inventory.reduce((s, i) => s + (i.quantity - i.reserved), 0) > 0,
        imageUrl: p.images[0]?.url ?? null,
      })),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
      totalPages: Math.ceil(total / opts.pageSize),
    }
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true, brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: { include: { warehouse: true } },
      },
    })
    if (!p) throw new NotFoundException('Product not found')
    return p
  }

  async create(dto: UpsertProductDto, actorId: string) {
    const slug = dto.slug ?? dto.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = await this.prisma.product.findUnique({ where: { slug } })
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`)

    const warehouse = await this.prisma.warehouse.findFirst({ where: { isActive: true } })
    if (!warehouse) throw new BadRequestException('No active warehouse found')

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku, slug, name: dto.name,
        shortDescription: dto.shortDescription,
        description: dto.description,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        specs: dto.specs ?? {},
        priceCents: 0,
        status: dto.status,
        isFeatured: dto.isFeatured,
        minOrderQty: dto.minOrderQty,
        weightGrams: dto.weightGrams,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        inventory: {
          create: { warehouseId: warehouse.id, quantity: dto.quantity, reorderLevel: 5 },
        },
      },
    })

    await this.prisma.auditLog.create({
      data: { actorId, action: 'product.create', entity: 'product', entityId: product.id, metadata: { sku: product.sku } },
    })
    return product
  }

  async update(id: string, dto: Partial<UpsertProductDto>, actorId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Product not found')

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        shortDescription: dto.shortDescription,
        description: dto.description,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        specs: dto.specs,
        status: dto.status as never,
        isFeatured: dto.isFeatured,
        minOrderQty: dto.minOrderQty,
        weightGrams: dto.weightGrams,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
    })

    // Update inventory quantity if provided
    if (dto.quantity !== undefined) {
      const inv = await this.prisma.inventory.findFirst({ where: { productId: id } })
      if (inv) {
        await this.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: dto.quantity } })
      }
    }

    await this.prisma.auditLog.create({
      data: { actorId, action: 'product.update', entity: 'product', entityId: id },
    })
    return product
  }

  async remove(id: string, actorId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Product not found')
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } })
    await this.prisma.auditLog.create({
      data: { actorId, action: 'product.delete', entity: 'product', entityId: id },
    })
    return { ok: true }
  }

  async addImage(
    productId: string,
    data: AddProductImageDto,
    actorId: string,
  ) {
    const count = await this.prisma.productImage.count({ where: { productId } })
    const created = await this.prisma.productImage.create({
      data: {
        productId,
        url: data.url,
        alt: data.alt,
        width: data.width,
        height: data.height,
        blurDataUrl: data.blurDataUrl,
        sortOrder: count,
      },
    })
    // Image attachment is a state-changing admin action — audit per CLAUDE.md.
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'product.image.add',
        entity: 'product',
        entityId: productId,
        metadata: { imageId: created.id, url: data.url },
      },
    })
    return created
  }

  async removeImage(imageId: string, actorId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image) throw new NotFoundException('Image not found')
    await this.prisma.productImage.delete({ where: { id: imageId } })
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'product.image.remove',
        entity: 'product',
        entityId: image.productId,
        metadata: { imageId, url: image.url },
      },
    })
    return { ok: true }
  }

  async reorderImages(productId: string, orderedIds: string[]) {
    // Verify every id belongs to the product before mutating — otherwise
    // a malformed request could shuffle sortOrder on someone else's images.
    const existing = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    })
    const valid = new Set(existing.map((i) => i.id))
    for (const id of orderedIds) {
      if (!valid.has(id)) {
        throw new BadRequestException(`Image ${id} does not belong to product ${productId}`)
      }
    }
    await this.prisma.$transaction(
      orderedIds.map((id, i) =>
        this.prisma.productImage.update({ where: { id }, data: { sortOrder: i } }),
      ),
    )
    return { ok: true }
  }

  // Stats for dashboard overview
  async stats() {
    const [products, categories, activeProducts, featuredProducts] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.product.count({ where: { isFeatured: true, deletedAt: null } }),
    ])
    return { products, categories, activeProducts, featuredProducts }
  }
}
