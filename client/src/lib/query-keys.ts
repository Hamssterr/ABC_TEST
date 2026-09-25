export const queryKeys = {
  health: ['health'] as const,
  customers: {
    all: ['customers'] as const,
    list: (params: { page: number; limit: number }) =>
      ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    quotations: (id: string, params?: { page?: number; limit?: number }) =>
      ['customers', 'quotations', id, params] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params: { page: number; limit: number }) =>
      ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  quotations: {
    all: ['quotations'] as const,
    detail: (id: string) => ['quotations', 'detail', id] as const,
    job: (jobId: string) => ['quotations', 'job', jobId] as const,
  },
  processingJobs: {
    detail: (id: string) => ['processingJobs', id] as const,
  },
} as const
