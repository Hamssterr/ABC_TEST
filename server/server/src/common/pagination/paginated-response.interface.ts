import { PaginationMeta } from './pagination-meta.interface.js';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
