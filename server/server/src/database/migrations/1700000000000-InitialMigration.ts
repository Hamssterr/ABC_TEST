import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Create enums
    await queryRunner.query(
      `CREATE TYPE "quotation_status_enum" AS ENUM('SUBMITTED', 'COMPLETED', 'FAILED');`,
    );
    await queryRunner.query(
      `CREATE TYPE "processing_job_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');`,
    );
    await queryRunner.query(
      `CREATE TYPE "processor_type_enum" AS ENUM('HOSTED_MOCK');`,
    );

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "company_name" character varying,
        "email" character varying,
        "phone" character varying,
        "address" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_code" UNIQUE ("code")
      );
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sku" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "unit" character varying NOT NULL,
        "unit_price" numeric(15,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
        CONSTRAINT "CHK_products_unit_price" CHECK (unit_price >= 0)
      );
    `);

    // Create quotations table
    await queryRunner.query(`
      CREATE TABLE "quotations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quotation_number" character varying NOT NULL,
        "customer_id" uuid NOT NULL,
        "customer_snapshot" jsonb NOT NULL,
        "status" "quotation_status_enum" NOT NULL DEFAULT 'SUBMITTED',
        "subtotal" numeric(15,2) NOT NULL,
        "discount_amount" numeric(15,2) NOT NULL DEFAULT 0.00,
        "tax_rate" numeric(5,2) NOT NULL DEFAULT 10.00,
        "tax_amount" numeric(15,2) NOT NULL,
        "total_amount" numeric(15,2) NOT NULL,
        "valid_until" date NOT NULL,
        "delivery_address" text,
        "payment_terms" text,
        "notes" text,
        "template_version" character varying NOT NULL DEFAULT 'v1',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quotations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_quotations_quotation_number" UNIQUE ("quotation_number"),
        CONSTRAINT "FK_quotations_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_quotations_subtotal" CHECK (subtotal >= 0),
        CONSTRAINT "CHK_quotations_discount_amount" CHECK (discount_amount >= 0 AND discount_amount <= subtotal),
        CONSTRAINT "CHK_quotations_tax_rate" CHECK (tax_rate >= 0 AND tax_rate <= 100),
        CONSTRAINT "CHK_quotations_tax_amount" CHECK (tax_amount >= 0),
        CONSTRAINT "CHK_quotations_total_amount" CHECK (total_amount >= 0)
      );
    `);

    // Create quotation_items table
    await queryRunner.query(`
      CREATE TABLE "quotation_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quotation_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_sku" character varying NOT NULL,
        "product_name" character varying NOT NULL,
        "description" text,
        "unit" character varying NOT NULL,
        "quantity" numeric(12,2) NOT NULL,
        "unit_price" numeric(15,2) NOT NULL,
        "line_total" numeric(15,2) NOT NULL,
        CONSTRAINT "PK_quotation_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quotation_items_quotation_id" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_quotation_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_quotation_items_quantity" CHECK (quantity > 0),
        CONSTRAINT "CHK_quotation_items_unit_price" CHECK (unit_price >= 0),
        CONSTRAINT "CHK_quotation_items_line_total" CHECK (line_total >= 0)
      );
    `);

    // Create processing_jobs table
    await queryRunner.query(`
      CREATE TABLE "processing_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quotation_id" uuid NOT NULL,
        "processor_type" "processor_type_enum" NOT NULL DEFAULT 'HOSTED_MOCK',
        "status" "processing_job_status_enum" NOT NULL DEFAULT 'PENDING',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "error_message" text,
        "file_path" text,
        "file_name" character varying,
        "file_checksum" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_processing_jobs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_processing_jobs_quotation_id" UNIQUE ("quotation_id"),
        CONSTRAINT "FK_processing_jobs_quotation_id" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_processing_jobs_attempt_count" CHECK (attempt_count >= 0)
      );
    `);

    // Indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_pagination" ON "customers" ("created_at" DESC, "id" DESC) WHERE "deleted_at" IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_pagination" ON "products" ("created_at" DESC, "id" DESC) WHERE "deleted_at" IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_processing_jobs_status_created" ON "processing_jobs" ("status", "created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quotations_customer_id" ON "quotations" ("customer_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quotation_items_quotation_id" ON "quotation_items" ("quotation_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_quotation_items_product_id" ON "quotation_items" ("product_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_processing_jobs_quotation_id" ON "processing_jobs" ("quotation_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_processing_jobs_quotation_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quotation_items_product_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quotation_items_quotation_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quotations_customer_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_processing_jobs_status_created";`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_pagination";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_pagination";`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "processing_jobs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotation_items";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers";`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "processor_type_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "processing_job_status_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "quotation_status_enum";`);
  }
}
