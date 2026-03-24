import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/database/typeorm/typeOrm.config';

import { Category } from '../entities/category.entity';
import { Color } from '../entities/color.entity';
import { Country } from '../entities/country.entity';
import { Currency } from '../entities/currency.entity';
import { Inventory } from '../entities/inventory.entity';
import { Product } from '../entities/product.entity';
import { ProductVariation } from '../entities/productVariation.entity';
import { ProductVariationPrice } from '../entities/productVariation_price.entity';
import { Role } from '../entities/role.entity';
import { Size } from '../entities/size.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  public createTypeOrmOptions(): TypeOrmModuleOptions {
    const { entities, migrations, subscribers, ...options } =
      dataSourceOptions as any;
    return {
      ...options,
      entities: [
        Category,
        Color,
        Country,
        Currency,
        Inventory,
        Product,
        ProductVariation,
        ProductVariationPrice,
        Role,
        Size,
        User,
      ],
      synchronize: false,
      migrationsRun: true,
    };
  }
}
