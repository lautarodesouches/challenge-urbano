import { config } from 'dotenv';
import { resolve } from 'path';
import { getEnvPath } from '../../common/helper/env.helper';
import { DataSourceOptions } from 'typeorm';

const envFilePath: string = getEnvPath(
  resolve(__dirname, '../..', 'common/envs'),
);
config({ path: envFilePath });
import { configuration } from '../../config';

const configOptions = configuration();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configOptions.database.host,
  port: configOptions.database.port,
  database: configOptions.database.name,
  username: configOptions.database.user,
  password: configOptions.database.password,
  entities: ['dist/**/*.entity.{ts,js}'],
  migrations: ['dist/database/migration/**/*.{ts,js}'],
  logger: 'simple-console',
  synchronize: false, // never use TRUE in production!
  logging: process.env.NODE_ENV !== 'production', // for debugging in dev Area only
  ssl: configOptions.database.ssl ? { rejectUnauthorized: false } : false,
};
