import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminProductsService } from './admin-products.service'

@Module({
  controllers: [AdminController],
  providers: [AdminProductsService],
  exports: [AdminProductsService],
})
export class AdminModule {}
