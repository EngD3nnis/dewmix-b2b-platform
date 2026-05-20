import { Controller, Get, Header } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../../infrastructure/prisma/prisma.service'
import { Public } from '../../auth/decorators'

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  async list() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, slug: true, name: true, iconName: true, imageUrl: true, parentId: true },
    })
  }
}
