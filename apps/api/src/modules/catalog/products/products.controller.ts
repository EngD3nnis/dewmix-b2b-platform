import { Controller, Get, Header, Param, Query, UsePipes } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { ProductListQuerySchema, type ProductListQuery } from '@dewmix/types'
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe'
import { Public } from '../../auth/decorators'
import { ProductsService } from './products.service'

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  @ApiOkResponse({ description: 'Paginated list of active products.' })
  @UsePipes(new ZodValidationPipe(ProductListQuerySchema))
  list(@Query() query: ProductListQuery) {
    return this.products.list(query)
  }

  @Public()
  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800')
  findOne(@Param('slug') slug: string) {
    return this.products.findBySlug(slug)
  }
}
