import { PaginationMeta } from '../pagination/pagination-meta.interface.js';

export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

export interface ApiPaginatedResponse<T = any> {
  message: string;
  data: T[];
  meta: PaginationMeta;
}
