import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../typeorm/typeOrm.config';

// Importar entidades explicitamente para evitar el bug de TypeORM globs de dependencias cruzadas
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

import { CategorySeeder } from './seeders/1-root/category.seeder';
import { ColorSeeder } from './seeders/1-root/color.seeder';
import { CountrySeeder } from './seeders/1-root/country.seeder';
import { CurrencySeeder } from './seeders/1-root/currency.seeder';
import { RoleSeeder } from './seeders/1-root/role.seeder';
import { SizeSeeder } from './seeders/1-root/size.seeder';
import { AdminSeeder } from './seeders/2-composite/admin.seeder';
import { UserSeeder } from './seeders/2-composite/user.seeder';
import { ProductSeeder } from './seeders/2-composite/product.seeder';

async function bootstrap() {
  console.log('🔄 Inicializando DataSource de TypeORM para Seeding (Standalone)...');
  
  const { migrations, entities, subscribers, ...baseOptions } = dataSourceOptions as any;

  const seedDataSourceOptions = {
    ...baseOptions,
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
    synchronize: true, // Asegurar que existan tablas si esto corre antes de las migraciones
  };

  const dataSource = new DataSource(seedDataSourceOptions as any);

  console.log('--- DEBUG seedDataSourceOptions ---');
  console.log(seedDataSourceOptions);
  console.log('-----------------------------------');

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a Base de Datos establecida.');

    const manager = dataSource.manager;

    console.log('--- 🌱 Etapa 1: Dominios Root ---');
    console.log('>> Ejecutando CategorySeeder...');
    await new CategorySeeder().seed(manager);
    
    console.log('>> Ejecutando ColorSeeder...');
    await new ColorSeeder().seed(manager);

    console.log('>> Ejecutando CountrySeeder...');
    await new CountrySeeder().seed(manager);

    console.log('>> Ejecutando CurrencySeeder...');
    await new CurrencySeeder().seed(manager);

    console.log('>> Ejecutando RoleSeeder...');
    await new RoleSeeder().seed(manager);

    console.log('>> Ejecutando SizeSeeder...');
    await new SizeSeeder().seed(manager);

    console.log('--- 🌱 Etapa 2: Dominios Compuestos ---');
    console.log('>> Ejecutando AdminSeeder...');
    await new AdminSeeder().seed(manager);

    console.log('>> Ejecutando UserSeeder...');
    await new UserSeeder().seed(manager);

    console.log('>> Ejecutando ProductSeeder...');
    await new ProductSeeder().seed(manager);

    console.log('🎉 Seeding Topológico Completado Exitosamente.');
  } catch (error) {
    console.error('❌ Fallo Crítico durante el Seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexión cerrada.');
    }
  }
}

bootstrap();
