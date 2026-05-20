import { Module } from '@nestjs/common'
import { ProductsController } from './products/products.controller'
import { ProductsService } from './products/products.service'
import { CategoriesController } from './categories/categories.controller'

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class CatalogModule {}
