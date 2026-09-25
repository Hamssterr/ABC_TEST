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
import { QuotationEntity } from '../quotations/enitities/quotation.entity.js';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ name: 'company_name', type: 'varchar', nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => QuotationEntity, (quotation) => quotation.customer)
  quotations!: Relation<QuotationEntity>[];
}
