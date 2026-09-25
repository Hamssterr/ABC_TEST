import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import { CustomerEntity } from '../modules/customers/customer.entity.js';
import { ProductEntity } from '../modules/products/product.entity.js';
import { QuotationEntity } from '../modules/quotations/enitities/quotation.entity.js';
import { QuotationItemEntity } from '../modules/quotations/enitities/quotation-item.entity.js';
import { ProcessingJobEntity } from '../modules/processing-jobs/processing-job.entity.js';
import { InitialMigration1700000000000 } from './migrations/1700000000000-InitialMigration.js';

dotenv.config();

export function createTypeOrmOptions(options?: {
  databaseUrl?: string;
  ssl?: boolean;
  poolMax?: number;
}): DataSourceOptions {
  const url = options?.databaseUrl ?? process.env.DATABASE_URL;
  const isSsl = options?.ssl ?? process.env.DATABASE_SSL !== 'false';
  const maxPool =
    options?.poolMax ?? Number(process.env.DATABASE_POOL_MAX ?? 5);

  return {
    type: 'postgres',
    url: url || undefined,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    extra: {
      max: maxPool,
    },
    entities: [
      CustomerEntity,
      ProductEntity,
      QuotationEntity,
      QuotationItemEntity,
      ProcessingJobEntity,
    ],
    migrations: [InitialMigration1700000000000],
    synchronize: false,
    migrationsRun: false,
    logging:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn', 'schema']
        : ['error'],
  };
}

const AppDataSource = new DataSource(createTypeOrmOptions());
export default AppDataSource;
