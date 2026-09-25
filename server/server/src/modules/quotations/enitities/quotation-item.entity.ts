import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { QuotationEntity } from './quotation.entity.js';
import { ProductEntity } from '../../products/product.entity.js';

@Entity('quotation_items')
export class QuotationItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'quotation_id', type: 'uuid' })
  quotationId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'product_sku', type: 'varchar' })
  productSku!: string;

  @Column({ name: 'product_name', type: 'varchar' })
  productName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar' })
  unit!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 15, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'line_total', type: 'numeric', precision: 15, scale: 2 })
  lineTotal!: string;

  @ManyToOne(() => QuotationEntity, (quotation) => quotation.items, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation!: Relation<QuotationEntity>;

  @ManyToOne(() => ProductEntity, (product) => product.quotationItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Relation<ProductEntity>;
}
