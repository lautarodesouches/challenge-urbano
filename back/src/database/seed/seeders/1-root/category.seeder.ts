import { EntityManager } from 'typeorm';
import { Category, CategoryIds, Categories } from '../../../entities/category.entity';
import { SeederInterface } from '../../seeder.interface';

export class CategorySeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const categories: Partial<Category>[] = [
      { id: CategoryIds.Computers, name: Categories.Computers },
      { id: CategoryIds.Fashion, name: Categories.Fashion },
    ];

    await manager.getRepository(Category).upsert(categories, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
