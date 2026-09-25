import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { QuotationItemEntity } from '../quotations/enitities/quotation-item.entity.js';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  sku!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  unit!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 15, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => QuotationItemEntity, (item) => item.product)
  quotationItems!: Relation<QuotationItemEntity>[];
}
