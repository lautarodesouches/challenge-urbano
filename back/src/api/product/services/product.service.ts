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
import { ProductVariationPrice } from '../../../database/entities/productVariation_price.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PRODUCT_QUEUE, NOTIFICATION_QUEUE } from '../../queue/queue.constants';
import {
  ProductCreatedPayload,
  ProductActivatedPayload,
  PriceChangedPayload,
} from '../../queue/queue.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectQueue(PRODUCT_QUEUE) private readonly productQueue: Queue,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  async getProducts() {
    const products = await this.entityManager.find(Product, {
      order: { id: 'DESC' },
    });

    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        const priceEntity = await this.entityManager
          .createQueryBuilder(ProductVariationPrice, 'price')
          .innerJoin('price.productVariation', 'variation')
          .where('variation.productId = :productId', { productId: product.id })
          .getOne();

        return {
          ...product,
          price: priceEntity ? priceEntity.price : null,
        };
      }),
    );

    return productsWithPrices;
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

    // Fanout: Notification + Products
    const createdPayload = {
      productId: savedProduct.id,
      categoryId: category.id,
      merchantId: merchantId,
    } as ProductCreatedPayload;

    await this.productQueue.add('product.created', createdPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    await this.notificationQueue.add('product.created', createdPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
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

    const activatedPayload = {
      productId: activatedProduct.id,
      isActive: activatedProduct.isActive,
      timestamp: new Date(),
    } as ProductActivatedPayload;

    await this.productQueue.add('product.activated', activatedPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    await this.notificationQueue.add('product.activated', activatedPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return activatedProduct;
  }

  async deactivateProduct(productId: number, merchantId: number) {
    const result = await this.entityManager
      .createQueryBuilder()
      .update<Product>(Product)
      .set({ isActive: false })
      .where('id = :id', { id: productId })
      .andWhere('merchantId = :merchantId', { merchantId })
      .returning(['id', 'isActive'])
      .execute();

    if (result.affected < 1) {
      throw new NotFoundException(errorMessages.product.notFound);
    }

    const deactivatedProduct = result.raw[0];

    // Emitimos el evento 'product.deactivated' a las colas
    const deactivatedPayload = {
      productId: deactivatedProduct.id,
      isActive: false,
      timestamp: new Date(),
    } as ProductActivatedPayload;

    await this.productQueue.add('product.deactivated', deactivatedPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    
    await this.notificationQueue.add('product.deactivated', deactivatedPayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return deactivatedProduct;
  }

  async validate(productId: number) {
    const product = await this.entityManager.findOne(Product, {
      where: {
        id: productId,
      },
    });
    if (!product) throw new NotFoundException(errorMessages.product.notFound);

    // Convert the plain DB result into a fully instantiated class,
    // which transforms the nested 'details' jsonb into ComputerDetails or TestDetails
    const { plainToInstance } = await import('class-transformer');
    const productInstance = plainToInstance(Product, product);

    const errors = await validate(productInstance);

    if (errors.length > 0) {
      throw new ConflictException(
        'Validation failed: ' +
          JSON.stringify(errors.map((e) => e.constraints)),
      );
    }

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
    let priceEntity = await this.entityManager
      .createQueryBuilder(ProductVariationPrice, 'price')
      .innerJoin('price.productVariation', 'variation')
      .where('variation.productId = :productId', { productId })
      .getOne();

    let previousPrice = 0;

    if (!priceEntity) {
      // Create variation and price entity for new products
      const { ProductVariation } = await import(
        '../../../database/entities/productVariation.entity'
      );
      let variation = await this.entityManager.findOneBy(ProductVariation, {
        productId,
      });

      if (!variation) {
        variation = this.entityManager.create(ProductVariation, {
          product,
          productId,
          sizeCode: 'NA',
          colorName: 'NA',
          imageUrls: [],
        });
        await this.entityManager.save(ProductVariation, variation);
      }

      priceEntity = this.entityManager.create(ProductVariationPrice, {
        productVariation: variation,
        productVariationId: variation.id,
        countryCode: 'US',
        currencyCode: 'USD',
        price: basePrice,
      });
      await this.entityManager.save(ProductVariationPrice, priceEntity);

      const { Inventory } = await import(
        '../../../database/entities/inventory.entity'
      );
      const inventoryEntity = this.entityManager.create(Inventory, {
        productVariation: variation,
        productVariationId: variation.id,
        countryCode: 'US',
        quantity: 10,
      });
      await this.entityManager.save(Inventory, inventoryEntity);
    } else {
      previousPrice = priceEntity.price;
      priceEntity.price = basePrice;
      await this.entityManager.save(ProductVariationPrice, priceEntity);
    }

    const pricePayload = {
      productId: product.id,
      productTitle: product.title,
      oldPrice: previousPrice,
      newPrice: basePrice,
      timestamp: new Date(),
    } as PriceChangedPayload;

    await this.productQueue.add('product.price_changed', pricePayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    await this.notificationQueue.add('product.price_changed', pricePayload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return { success: true, newPrice: basePrice };
  }
}
