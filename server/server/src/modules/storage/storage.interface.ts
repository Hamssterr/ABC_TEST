export interface StoredFile {
  path: string;
  fileName: string;
  checksum: string;
}

export interface UploadPdfInput {
  buffer: Buffer;
  path: string;
  fileName: string;
}

export interface FileStorage {
  uploadPdf(input: UploadPdfInput): Promise<StoredFile>;
  createSignedDownloadUrl(path: string, expiresIn?: number): Promise<string>;
}
