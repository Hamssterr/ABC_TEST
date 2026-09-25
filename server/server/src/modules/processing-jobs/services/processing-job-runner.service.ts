import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ProcessingJobsService,
  sanitizeErrorMessage,
} from './processing-jobs.service.js';
import { QUOTATION_PROCESSOR_TOKEN } from '../processor/quotation-processor.token.js';
import type { QuotationProcessor } from '../processor/quotation-processor.interface.js';

@Injectable()
export class ProcessingJobRunner
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(ProcessingJobRunner.name);
  private isProcessing = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly processingJobsService: ProcessingJobsService,
    @Inject(QUOTATION_PROCESSOR_TOKEN)
    private readonly processor: QuotationProcessor,
  ) {}

  async onModuleInit(): Promise<void> {
    const isEnabled = this.configService.get<boolean>(
      'JOB_PROCESSOR_ENABLED',
      false,
    );
    const pollInterval = this.configService.get<number>(
      'JOB_POLL_INTERVAL_MS',
      2000,
    );

    if (isEnabled) {
      this.logger.log(
        `Starting background job processor with poll interval ${pollInterval}ms`,
      );
      try {
        const recovered = await this.processingJobsService.recoverStalledJobs();
        if (recovered > 0) {
          this.logger.log(
            `Recovered ${recovered} stalled jobs back to PENDING`,
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to recover stalled jobs: ${sanitizeErrorMessage(err)}`,
        );
      }
      this.startPolling(pollInterval);
    } else {
      this.logger.log(
        'Background job processor is disabled (JOB_PROCESSOR_ENABLED=false).',
      );
    }
  }

  onApplicationShutdown(): void {
    this.stopPolling();
  }

  startPolling(intervalMs: number): void {
    this.stopPolling();
    this.intervalTimer = setInterval(() => {
      this.handleIntervalTick().catch((err) => {
        const safeErr = sanitizeErrorMessage(err);
        this.logger.error(`Error in interval tick handler: ${safeErr}`);
      });
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  async handleIntervalTick(): Promise<void> {
    const isEnabled = this.configService.get<boolean>(
      'JOB_PROCESSOR_ENABLED',
      false,
    );

    if (!isEnabled) {
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const job = await this.processingJobsService.claimNextJob();
      if (!job) {
        return;
      }

      this.logger.log(
        `Claimed job ${job.id} for quotation ${job.quotationId} (attempt ${job.attemptCount})`,
      );

      try {
        const result = await this.processor.process(job);
        await this.processingJobsService.completeJob(job.id, result);
        this.logger.log(`Job ${job.id} completed successfully`);
      } catch (procError) {
        const safeErr = sanitizeErrorMessage(procError);
        this.logger.error(`Job ${job.id} processing failed: ${safeErr}`);
        await this.processingJobsService.failJob(job.id, procError);
      }
    } catch (claimError) {
      const safeClaimErr = sanitizeErrorMessage(claimError);
      this.logger.error(`Error during job runner cycle: ${safeClaimErr}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
