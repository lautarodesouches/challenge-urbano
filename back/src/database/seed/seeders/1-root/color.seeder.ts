import { EntityManager } from 'typeorm';
import { Color, Colors, ColorsHexCodes } from '../../../entities/color.entity';
import { SeederInterface } from '../../seeder.interface';

export class ColorSeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const data: Partial<Color>[] = [];
    Object.keys(Colors).forEach((key) => {
      data.push({
        name: Colors[key as keyof typeof Colors],
        hexCode: ColorsHexCodes[key as keyof typeof ColorsHexCodes],
      });
    });

    await manager.getRepository(Color).upsert(data, {
      conflictPaths: ['name'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
