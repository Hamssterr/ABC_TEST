import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter.js';
import type { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  const createMockArgumentsHost = (url: string, originalUrl?: string) => {
    const statusSpy = vi.fn().mockReturnThis();
    const jsonSpy = vi.fn();

    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          originalUrl: originalUrl ?? url,
        }),
        getResponse: () => ({
          status: statusSpy,
          json: jsonSpy,
        }),
      }),
    } as unknown as ArgumentsHost;

    return { host, statusSpy, jsonSpy };
  };

  it('should format standard HttpException and strip query params from path', () => {
    const { host, statusSpy, jsonSpy } = createMockArgumentsHost(
      '/api/products?token=secret123',
    );
    const exception = new BadRequestException('Validation failed');

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['Validation failed'],
        error: 'Bad Request',
        path: '/api/products',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should mask unexpected errors with 500 and not leak internal error message', () => {
    const { host, statusSpy, jsonSpy } =
      createMockArgumentsHost('/api/quotations');
    const exception = new Error(
      'Database connection credentials leaked: root:pass',
    );

    filter.catch(exception, host);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: ['Internal server error'],
        error: 'Internal Server Error',
        path: '/api/quotations',
      }),
    );
  });
});
