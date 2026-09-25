import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProcessingJobEntity } from '../processing-job.entity.js';
import { QuotationEntity } from '../../quotations/enitities/quotation.entity.js';
import { ProcessingJobStatus } from '../../../database/enums/processing-job-status.enum.js';
import { QuotationStatus } from '../../../database/enums/quotation-status.enum.js';
import { ProcessingJobResponseDto } from '../dto/processing-job-response.dto.js';
import { RetryProcessingJobResponseDto } from '../dto/retry-processing-job-response.dto.js';
import type { ProcessorResult } from '../processor/quotation-processor.interface.js';
import { ApiResponse } from '../../../common/interfaces/api-response.interface.js';

export function sanitizeErrorMessage(error: unknown): string {
  if (!error) return 'Quotation processing failed';
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

  if (
    /postgres:\/\/|postgresql:\/\/|Bearer\s|apiKey|api_key|service_role|SECRET|KEY/i.test(
      raw,
    ) ||
    raw.includes('password')
  ) {
    return 'Quotation processing failed';
  }

  const firstLine = raw.split('\n')[0].trim();
  if (firstLine.length > 255) {
    return firstLine.slice(0, 255);
  }
  return firstLine || 'Quotation processing failed';
}

@Injectable()
export class ProcessingJobsService {
  constructor(
    @InjectRepository(ProcessingJobEntity)
    private readonly jobRepository: Repository<ProcessingJobEntity>,
    @InjectRepository(QuotationEntity)
    private readonly quotationRepository: Repository<QuotationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getJobStatus(
    jobId: string,
  ): Promise<ApiResponse<ProcessingJobResponseDto>> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(
        `Processing job with ID "${jobId}" not found`,
      );
    }

    return {
      message: 'Lấy trạng thái xử lý thành công',
      data: ProcessingJobResponseDto.fromEntity(job),
    };
  }

  async claimNextJob(): Promise<ProcessingJobEntity | null> {
    const query = `
      UPDATE processing_jobs
      SET
        status = 'PROCESSING',
        attempt_count = attempt_count + 1,
        started_at = NOW(),
        completed_at = NULL,
        error_message = NULL
      WHERE id = (
        SELECT id
        FROM processing_jobs
        WHERE status = 'PENDING'
          AND attempt_count < 3
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id;
    `;

    const result = await this.dataSource.query(query);
    // In TypeORM with Postgres, UPDATE ... RETURNING returns [rows, affectedCount]
    const rows: Array<{ id: string }> =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : Array.isArray(result)
          ? result
          : [];

    if (!rows || rows.length === 0 || !rows[0]?.id) {
      return null;
    }

    const claimedId = rows[0].id;
    return this.jobRepository.findOne({
      where: { id: claimedId },
      relations: { quotation: true },
    });
  }

  async recoverStalledJobs(): Promise<number> {
    const result = await this.jobRepository.update(
      { status: ProcessingJobStatus.PROCESSING },
      { status: ProcessingJobStatus.PENDING },
    );
    return result.affected || 0;
  }

  async completeJob(jobId: string, result: ProcessorResult): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateResult = await queryRunner.manager.update(
        ProcessingJobEntity,
        { id: jobId, status: ProcessingJobStatus.PROCESSING },
        {
          status: ProcessingJobStatus.COMPLETED,
          completedAt: new Date(),
          filePath: result.filePath,
          fileName: result.fileName,
          fileChecksum: result.fileChecksum,
          errorMessage: null,
        },
      );

      if (updateResult.affected === 0) {
        throw new ConflictException(
          `Cannot complete job ${jobId}: job is not in PROCESSING status`,
        );
      }

      const job = await queryRunner.manager.findOne(ProcessingJobEntity, {
        where: { id: jobId },
      });

      if (job) {
        await queryRunner.manager.update(
          QuotationEntity,
          { id: job.quotationId },
          { status: QuotationStatus.COMPLETED },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async failJob(jobId: string, error: unknown): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sanitized = sanitizeErrorMessage(error);
      const updateResult = await queryRunner.manager.update(
        ProcessingJobEntity,
        { id: jobId, status: ProcessingJobStatus.PROCESSING },
        {
          status: ProcessingJobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: sanitized,
        },
      );

      if (updateResult.affected === 0) {
        throw new ConflictException(
          `Cannot fail job ${jobId}: job is not in PROCESSING status`,
        );
      }

      const job = await queryRunner.manager.findOne(ProcessingJobEntity, {
        where: { id: jobId },
      });

      if (job) {
        await queryRunner.manager.update(
          QuotationEntity,
          { id: job.quotationId },
          { status: QuotationStatus.FAILED },
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async retryJob(
    jobId: string,
  ): Promise<ApiResponse<RetryProcessingJobResponseDto>> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(
        `Processing job with ID "${jobId}" not found`,
      );
    }

    if (job.status !== ProcessingJobStatus.FAILED) {
      throw new ConflictException(
        `Job cannot be retried in current status "${job.status}". Only FAILED jobs can be retried.`,
      );
    }

    if (job.attemptCount >= 3) {
      throw new ConflictException(
        'Job has reached maximum retry attempts (3). Cannot retry further.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateResult = await queryRunner.manager.update(
        ProcessingJobEntity,
        {
          id: jobId,
          status: ProcessingJobStatus.FAILED,
        },
        {
          status: ProcessingJobStatus.PENDING,
          startedAt: null,
          completedAt: null,
          errorMessage: null,
          filePath: null,
          fileName: null,
          fileChecksum: null,
        },
      );

      if (updateResult.affected === 0) {
        throw new ConflictException(
          'Concurrent retry attempt detected. Job status has changed.',
        );
      }

      await queryRunner.manager.update(
        QuotationEntity,
        { id: job.quotationId },
        { status: QuotationStatus.SUBMITTED },
      );

      await queryRunner.commitTransaction();

      return {
        message: 'Đã đưa yêu cầu vào hàng chờ xử lý lại',
        data: {
          jobId: job.id,
          quotationId: job.quotationId,
          status: ProcessingJobStatus.PENDING,
          attemptCount: job.attemptCount,
          maxAttempts: 3,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
