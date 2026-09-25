import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { QuotationEntity } from '../quotations/enitities/quotation.entity.js';
import { ProcessingJobStatus } from '../../database/enums/processing-job-status.enum.js';
import { ProcessorType } from '../../database/enums/processor-type.enum.js';

@Entity('processing_jobs')
export class ProcessingJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'quotation_id', type: 'uuid', unique: true })
  quotationId!: string;

  @Column({
    name: 'processor_type',
    type: 'enum',
    enum: ProcessorType,
    default: ProcessorType.HOSTED_MOCK,
  })
  processorType!: ProcessorType;

  @Column({
    type: 'enum',
    enum: ProcessingJobStatus,
    default: ProcessingJobStatus.PENDING,
  })
  status!: ProcessingJobStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath!: string | null;

  @Column({ name: 'file_name', type: 'varchar', nullable: true })
  fileName!: string | null;

  @Column({ name: 'file_checksum', type: 'varchar', nullable: true })
  fileChecksum!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @OneToOne(() => QuotationEntity, (quotation) => quotation.processingJob, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation!: Relation<QuotationEntity>;
}
