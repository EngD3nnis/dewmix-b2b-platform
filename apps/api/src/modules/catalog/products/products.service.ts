import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@dewmix/db'
import type { Paginated, ProductListQuery, ProductSummary } from '@dewmix/types'
import { PrismaService } from '../../../infrastructure/prisma/prisma.service'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated, filtered product listing.
   * Used by category pages, search results, and home featured grid.
   */
  async list(query: ProductListQuery): Promise<Paginated<ProductSummary>> {
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      ...(query.featured ? { isFeatured: true } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.brand ? { brand: { slug: query.brand } } : {}),
      ...(query.q
        ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { sku: { contains: query.q, mode: 'insensitive' } }] }
        : {}),
      ...(query.minPrice || query.maxPrice
        ? { priceCents: { gte: query.minPrice ?? undefined, lte: query.maxPrice ?? undefined } }
        : {}),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'price_asc':
          return { priceCents: 'asc' }
        case 'price_desc':
          return { priceCents: 'desc' }
        case 'newest':
          return { createdAt: 'desc' }
        default:
          return { popularityScore: 'desc' }
      }
    })()

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          slug: true,
          sku: true,
          name: true,
          shortDescription: true,
          isFeatured: true,
          minOrderQty: true,
          specs: true,
          images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true, blurDataUrl: true } },
          category: { select: { slug: true, name: true } },
          brand: { select: { slug: true, name: true } },
          inventory: { select: { quantity: true, reserved: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    return {
      items: items.map(this.toSummary),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    }
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'ACTIVE', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        brand: true,
        variants: true,
        inventory: { select: { quantity: true, reserved: true, warehouse: { select: { city: true } } } },
      },
    })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  private toSummary = (
    p: Prisma.ProductGetPayload<{
      select: {
        id: true; slug: true; sku: true; name: true; shortDescription: true;
        isFeatured: true; minOrderQty: true; specs: true;
        images: { select: { url: true; blurDataUrl: true } };
        category: { select: { slug: true; name: true } };
        brand: { select: { slug: true; name: true } };
        inventory: { select: { quantity: true; reserved: true } };
      }
    }>
  ): ProductSummary => {
    const totalAvailable = p.inventory.reduce((sum, i) => sum + (i.quantity - i.reserved), 0)
    return {
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      shortDescription: p.shortDescription,
      isFeatured: p.isFeatured,
      minOrderQty: p.minOrderQty,
      specs: (p.specs as Record<string, string>) ?? {},
      imageUrl: p.images[0]?.url ?? null,
      imageBlurDataUrl: p.images[0]?.blurDataUrl ?? null,
      category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
      brand: p.brand ? { slug: p.brand.slug, name: p.brand.name } : null,
      inStock: totalAvailable > 0,
    }
  }
}
