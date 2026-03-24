import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RoleIds } from '../../role/enum/role.enum';
import { CreateProductDto, ProductDetailsDto } from '../dto/product.dto';
import { UpdatePriceDto } from '../dto/price.dto';
import { ProductService } from '../services/product.service';
import { Auth } from '../../auth/guards/auth.decorator';
import { FindOneParams } from '../../../common/helper/findOneParams.dto';
import { CurrentUser } from '../../auth/guards/user.decorator';
import { User } from '../../../database/entities/user.entity';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts() {
    return this.productService.getProducts();
  }

  @Get(':id')
  async getProduct(@Param() product: FindOneParams) {
    return this.productService.getProduct(product.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post('create')
  async createProduct(
    @Body() body: CreateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productService.createProduct(body, user.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':id/details')
  async addProductDetails(
    @Param() product: FindOneParams,
    @Body() body: ProductDetailsDto,
    @CurrentUser() user: User,
  ) {
    return this.productService.addProductDetails(product.id, body, user.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':id/activate')
  async activateProduct(
    @Param() product: FindOneParams,
    @CurrentUser() user: User,
  ) {
    return this.productService.activateProduct(product.id, user.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Delete(':id')
  async deleteProduct(
    @Param() product: FindOneParams,
    @CurrentUser() user: User,
  ) {
    return this.productService.deleteProduct(product.id, user.id);
  }

  @Auth(RoleIds.Admin, RoleIds.Merchant)
  @Post(':id/price')
  async updatePrice(
    @Param() product: FindOneParams,
    @Body() body: UpdatePriceDto,
    @CurrentUser() user: User,
  ) {
    return this.productService.updatePrice(product.id, body.newPrice, user.id);
  }
}
