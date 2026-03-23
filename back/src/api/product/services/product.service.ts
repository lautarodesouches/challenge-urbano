import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { CreateProductDto, ProductDetailsDto } from '../dto/product.dto';
import { Category } from '../../../database/entities/category.entity';
import { Product } from 'src/database/entities/product.entity';
import { errorMessages } from 'src/errors/custom';
import { validate } from 'class-validator';
import { successObject } from 'src/common/helper/sucess-response.interceptor';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductVariationPrice } from '../../../database/entities/productVariation_price.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async getProducts() {
    return this.entityManager.find(Product, {
      order: { id: 'DESC' },
    });
  }

  async getProduct(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });

    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    return product;
  }

  async createProduct(data: CreateProductDto, merchantId: number) {
    const category = await this.entityManager.findOne(Category, {
      where: {
        id: data.categoryId,
      },
    });

    if (!category) throw new NotFoundException(errorMessages.category.notFound);

    const product = await this.entityManager.create(Product, {
      category,
      merchantId,
    });

    const savedProduct = await this.entityManager.save(product);

    this.eventEmitter.emit('product.created', {
      productId: savedProduct.id,
      categoryId: category.id,
      merchantId: merchantId,
    });

    return savedProduct;
  }

  async addProductDetails(
    productId: number,
    body: ProductDetailsDto,
    merchantId: number,
  ) {
    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        ...body,
      })
      .where('id = :id', { id: productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .returning(['id'])
      .execute();
    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);
    return result.raw[0];
  }

  async activateProduct(productId: number, merchantId: number) {
    if (!(await this.validate(productId)))
      throw new ConflictException(errorMessages.product.notFulfilled);

    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({
        isActive: true,
      })
      .where('id = :id', { id: productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .returning(['id', 'isActive'])
      .execute();

    const activatedProduct = result.raw[0];

    this.eventEmitter.emit('product.activated', {
      productId: activatedProduct.id,
      isActive: activatedProduct.isActive,
      timestamp: new Date(),
    });

    return activatedProduct;
  }

  async validate(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });
    if (!product) throw new NotFoundException(errorMessages.product.notFound);
    const errors = await validate(product);

    if (errors.length > 0) return false;

    return true;
  }

  async deleteProduct(productId: number, merchantId: number) {
    const result = await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(Product)
      .where('id = :productId', { productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .execute();

    if (result.affected < 1)
      throw new NotFoundException(errorMessages.product.notFound);

    return successObject;
  }

  async updatePrice(productId: number, basePrice: number, merchantId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: { id: productId, merchantId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado o no autorizado');
    }

    // Buscamos directamente el primer precio activo del producto en Postgres 
    // sin basarnos en la variable relacional 'variations' que falta en el entity nativo.
    const priceEntity = await this.entityManager
      .createQueryBuilder(ProductVariationPrice, 'price')
      .innerJoin('price.productVariation', 'variation')
      .where('variation.productId = :productId', { productId })
      .getOne();

    if (!priceEntity) {
        throw new NotFoundException('No existe configuración de precios para este artículo');
    }

    const previousPrice = priceEntity.price;
    priceEntity.price = basePrice;
    await this.entityManager.save(ProductVariationPrice, priceEntity);

    this.eventEmitter.emit('product.price_changed', {
      productId: product.id,
      productTitle: product.title,
      oldPrice: previousPrice,
      newPrice: basePrice,
      timestamp: new Date(),
    });

    return { success: true, newPrice: basePrice };
  }
}

