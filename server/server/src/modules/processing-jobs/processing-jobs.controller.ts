import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProcessingJobsService } from './services/processing-jobs.service.js';
import { ProcessingJobResponseDto } from './dto/processing-job-response.dto.js';
import { RetryProcessingJobResponseDto } from './dto/retry-processing-job-response.dto.js';
import { ApiResponse } from '../../common/interfaces/api-response.interface.js';

@Controller('processing-jobs')
export class ProcessingJobsController {
  constructor(private readonly processingJobsService: ProcessingJobsService) {}

  @Get(':id')
  async getStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<ProcessingJobResponseDto>> {
    return this.processingJobsService.getJobStatus(id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  async retry(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<RetryProcessingJobResponseDto>> {
    return this.processingJobsService.retryJob(id);
  }
}
