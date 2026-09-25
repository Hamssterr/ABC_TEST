import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor.js';
import type { ExecutionContext, CallHandler } from '@nestjs/common';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request method, path, status, and duration on success', () => {
    return new Promise<void>((resolve) => {
      const mockRequest = {
        method: 'GET',
        originalUrl: '/api/products?page=1&limit=10',
        url: '/api/products?page=1&limit=10',
      };
      const mockResponse = {
        statusCode: 200,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockHandler: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      const spyLog = vi
        .spyOn((interceptor as any).logger, 'log')
        .mockImplementation(() => {});

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (val) => {
          expect(val).toEqual({ data: 'test' });
          expect(spyLog).toHaveBeenCalledWith(
            expect.stringMatching(/^GET \/api\/products 200 \d+ms$/),
          );
          resolve();
        },
      });
    });
  });

  it('should log request method, path, status, and duration on error', () => {
    return new Promise<void>((resolve) => {
      const mockRequest = {
        method: 'POST',
        originalUrl: '/api/quotations',
        url: '/api/quotations',
      };
      const mockResponse = {
        statusCode: 400,
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockHandler: CallHandler = {
        handle: () => throwError(() => new Error('Bad Request')),
      };

      const spyWarn = vi
        .spyOn((interceptor as any).logger, 'warn')
        .mockImplementation(() => {});

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => {
          expect(err.message).toBe('Bad Request');
          expect(spyWarn).toHaveBeenCalledWith(
            expect.stringMatching(/^POST \/api\/quotations 400 \d+ms$/),
          );
          resolve();
        },
      });
    });
  });
});
