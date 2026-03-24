import { EntityManager } from 'typeorm';
import {
  Currency,
  CurrencyCodes,
  CurrencyNames,
} from '../../../entities/currency.entity';
import { SeederInterface } from '../../seeder.interface';

export class CurrencySeeder implements SeederInterface {
  async seed(manager: EntityManager): Promise<void> {
    const data: Partial<Currency>[] = [];
    Object.keys(CurrencyCodes).forEach((key) => {
      data.push({
        code: CurrencyCodes[key as keyof typeof CurrencyCodes],
        name: CurrencyNames[key as keyof typeof CurrencyNames],
      });
    });

    await manager.getRepository(Currency).upsert(data, {
      conflictPaths: ['code'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
