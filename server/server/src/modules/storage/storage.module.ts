import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service.js';
import { FILE_STORAGE_TOKEN } from './storage.token.js';

@Module({
  providers: [
    SupabaseStorageService,
    {
      provide: FILE_STORAGE_TOKEN,
      useExisting: SupabaseStorageService,
    },
  ],
  exports: [SupabaseStorageService, FILE_STORAGE_TOKEN],
})
export class StorageModule {}
