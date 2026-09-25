import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { CustomerEntity } from '../../customers/customer.entity.js';
import { QuotationItemEntity } from './quotation-item.entity.js';
import { ProcessingJobEntity } from '../../processing-jobs/processing-job.entity.js';
import { QuotationStatus } from '../../../database/enums/quotation-status.enum.js';

@Entity('quotations')
export class QuotationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'quotation_number', type: 'varchar', unique: true })
  quotationNumber!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'customer_snapshot', type: 'jsonb' })
  customerSnapshot!: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: QuotationStatus,
    default: QuotationStatus.SUBMITTED,
  })
  status!: QuotationStatus;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  subtotal!: string;

  @Column({
    name: 'discount_amount',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: '0.00',
  })
  discountAmount!: string;

  @Column({
    name: 'tax_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: '10.00',
  })
  taxRate!: string;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 15, scale: 2 })
  taxAmount!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 15, scale: 2 })
  totalAmount!: string;

  @Column({ name: 'valid_until', type: 'date' })
  validUntil!: string;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress!: string | null;

  @Column({ name: 'payment_terms', type: 'text', nullable: true })
  paymentTerms!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'template_version', type: 'varchar', default: 'v1' })
  templateVersion!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => CustomerEntity, (customer) => customer.quotations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Relation<CustomerEntity>;

  @OneToMany(() => QuotationItemEntity, (item) => item.quotation)
  items!: Relation<QuotationItemEntity>[];

  @OneToOne(() => ProcessingJobEntity, (job) => job.quotation)
  processingJob?: Relation<ProcessingJobEntity>;
}
