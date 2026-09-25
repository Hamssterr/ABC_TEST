import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import crypto from 'node:crypto';
import type {
  FileStorage,
  StoredFile,
  UploadPdfInput,
} from './storage.interface.js';
import { sanitizeErrorMessage } from '../processing-jobs/services/processing-jobs.service.js';

@Injectable()
export class SupabaseStorageService implements FileStorage {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabaseClient: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      'quotation-files';
    this.initClient();
  }

  private initClient(): void {
    let supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (
      supabaseUrl &&
      supabaseUrl.includes('supabase.com/dashboard/project/')
    ) {
      const match = supabaseUrl.match(/\/project\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        supabaseUrl = `https://${match[1]}.supabase.co`;
      }
    }

    if (supabaseUrl && serviceRoleKey) {
      try {
        this.supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          realtime: {
            transport: WebSocket as any,
          },
        });
      } catch (err) {
        this.logger.error(
          `Failed to initialize Supabase client: ${sanitizeErrorMessage(err)}`,
        );
      }
    }
  }

  private getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      this.initClient();
    }
    if (!this.supabaseClient) {
      throw new InternalServerErrorException(
        'Supabase Storage is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    return this.supabaseClient;
  }

  async uploadPdf(input: UploadPdfInput): Promise<StoredFile> {
    if (!input.buffer || input.buffer.length === 0) {
      throw new BadRequestException('Cannot upload an empty PDF buffer.');
    }

    const maxSizeBytes = 25 * 1024 * 1024; // 25MB limit
    if (input.buffer.length > maxSizeBytes) {
      throw new BadRequestException(
        'PDF file exceeds maximum allowed size of 25MB.',
      );
    }

    if (!input.path || input.path.includes('..')) {
      throw new BadRequestException('Invalid storage path.');
    }

    const checksum = crypto
      .createHash('sha256')
      .update(input.buffer)
      .digest('hex');

    const client = this.getClient();

    try {
      const { error } = await client.storage
        .from(this.bucket)
        .upload(input.path, input.buffer, {
          contentType: 'application/pdf',
          upsert: true,
          cacheControl: '3600',
        });

      if (error) {
        this.logger.error(
          `Upload to Supabase Storage failed: ${sanitizeErrorMessage(error)}`,
        );
        throw new InternalServerErrorException(
          `Failed to upload quotation file: ${sanitizeErrorMessage(error)}`,
        );
      }

      return {
        path: input.path,
        fileName: input.fileName,
        checksum,
      };
    } catch (err: any) {
      const safeMsg = sanitizeErrorMessage(err);
      this.logger.error(`Storage upload error: ${safeMsg}`);
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Storage upload failed: ${safeMsg}`,
      );
    }
  }

  async createSignedDownloadUrl(
    path: string,
    expiresIn = 300,
  ): Promise<string> {
    if (!path || path.includes('..')) {
      throw new BadRequestException('Invalid file path.');
    }

    const client = this.getClient();

    try {
      const { data, error } = await client.storage
        .from(this.bucket)
        .createSignedUrl(path, expiresIn);

      if (error || !data?.signedUrl) {
        const safeMsg = sanitizeErrorMessage(
          error || 'Failed to create signed URL',
        );
        this.logger.error(`Create signed URL failed: ${safeMsg}`);
        throw new InternalServerErrorException(
          `Could not generate download URL: ${safeMsg}`,
        );
      }

      return data.signedUrl;
    } catch (err: any) {
      const safeMsg = sanitizeErrorMessage(err);
      this.logger.error(`Signed URL error: ${safeMsg}`);
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Could not generate download URL: ${safeMsg}`,
      );
    }
  }
}
