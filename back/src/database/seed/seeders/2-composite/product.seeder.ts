import { EntityManager } from 'typeorm';
import { Product, VariationTypes } from '../../../entities/product.entity';
import { Category, CategoryIds } from '../../../entities/category.entity';
import { User } from '../../../entities/user.entity';
import { SeederInterface } from '../../seeder.interface';
import { createValidatedInstance } from '../../helpers/create-instance';

import { Categories } from '../../../entities/category.entity';

export class ProductSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const category = await manager.findOneBy(Category, {
      id: CategoryIds.Computers,
    });
    const merchant = await manager.findOneBy(User, {
      email: 'admin@challenge.com',
    });

    if (!category || !merchant) {
      console.warn(
        '⚠️ Omite ProductSeeder: Faltan dependencias (Categoría o Mercader).',
      );
      return;
    }

    const code = 'PROD-MACBOOK-1';
    let savedProduct = await manager.findOneBy(Product, { code });

    if (!savedProduct) {
      const newProductData: Partial<Product> = {
        id: 9999,
        code,
        title: 'MacBook Pro 16',
        variationType: VariationTypes.NONE,
        description: 'Laptop Profesional',
        about: ['M2 Max', '32GB RAM'],
        details: {
          category: Categories.Computers,
          capacity: 1,
          capacityUnit: 'TB',
          capacityType: 'SSD',
          brand: 'Apple',
          series: 'MacBook Pro',
        },
        isActive: true,
        category: category,
        merchant: merchant,
        categoryId: category.id,
        merchantId: merchant.id,
      };

      const product = await createValidatedInstance(Product, newProductData);
      savedProduct = await manager.save(Product, product);
    }

    // Create default variation and price for the seeded product
    const { ProductVariation } = await import(
      '../../../entities/productVariation.entity'
    );
    const { ProductVariationPrice } = await import(
      '../../../entities/productVariation_price.entity'
    );

    let variation = await manager.findOneBy(ProductVariation, {
      productId: savedProduct.id,
    });
    if (!variation) {
      variation = manager.create(ProductVariation, {
        product: savedProduct,
        productId: savedProduct.id,
        // using arbitrary default codes that might exist or just letting typeorm insert them
        sizeCode: 'NA',
        colorName: 'NA',
        imageUrls: [],
      });
      await manager.save(ProductVariation, variation);
    }

    let priceEntity = await manager.findOneBy(ProductVariationPrice, {
      productVariationId: variation.id,
    });
    if (!priceEntity) {
      priceEntity = manager.create(ProductVariationPrice, {
        productVariation: variation,
        productVariationId: variation.id,
        countryCode: 'US', // Revert to US as requested
        currencyCode: 'USD',
        price: 2500,
      });
      await manager.save(ProductVariationPrice, priceEntity);
    }

    const { Inventory } = await import('../../../entities/inventory.entity');
    let inventoryEntity = await manager.findOneBy(Inventory, {
      productVariationId: variation.id,
    });
    if (!inventoryEntity) {
      inventoryEntity = manager.create(Inventory, {
        productVariation: variation,
        productVariationId: variation.id,
        countryCode: 'US',
        quantity: 10,
      });
      await manager.save(Inventory, inventoryEntity);
    }
  }
}
