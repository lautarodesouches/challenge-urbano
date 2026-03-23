import { EntityManager } from 'typeorm';
import { Product, VariationTypes } from '../../../entities/product.entity';
import { Category, CategoryIds } from '../../../entities/category.entity';
import { User } from '../../../entities/user.entity';
import { SeederInterface } from '../../seeder.interface';
import { createValidatedInstance } from '../../helpers/create-instance';

import { Categories } from '../../../entities/category.entity';

export class ProductSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const category = await manager.findOneBy(Category, { id: CategoryIds.Computers });
    const merchant = await manager.findOneBy(User, { email: 'admin@challenge.com' });

    if (!category || !merchant) {
      console.warn('⚠️ Omite ProductSeeder: Faltan dependencias (Categoría o Mercader).');
      return;
    }

    const code = 'PROD-MACBOOK-1';
    const existingProduct = await manager.findOneBy(Product, { code });
    if (existingProduct) return;

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
    await manager.save(Product, product);
  }
}
