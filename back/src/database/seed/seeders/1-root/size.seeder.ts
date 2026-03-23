import { EntityManager } from 'typeorm';
import { Size, SizeCodes } from '../../../entities/size.entity';
import { SeederInterface } from '../../seeder.interface';

export class SizeSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const data: Partial<Size>[] = [];
    Object.keys(SizeCodes).forEach((key) => {
      data.push({
        code: SizeCodes[key as keyof typeof SizeCodes],
      });
    });

    await manager.getRepository(Size).upsert(data, {
      conflictPaths: ['code'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
