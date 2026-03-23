import { EntityManager } from 'typeorm';
import { Country, Countries, CountryCodes } from '../../../entities/country.entity';
import { SeederInterface } from '../../seeder.interface';

export class CountrySeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const data: Partial<Country>[] = [];
    Object.keys(Countries).forEach((key) => {
      data.push({
        code: CountryCodes[key as keyof typeof CountryCodes],
        name: Countries[key as keyof typeof Countries],
      });
    });

    await manager.getRepository(Country).upsert(data, {
      conflictPaths: ['code'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
