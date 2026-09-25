import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  GatewayTimeoutException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type {
  QuotationDraftExtractor,
  ExtractedQuotationDraft,
} from './quotation-draft-extractor.interface.js';
import {
  SYSTEM_INSTRUCTION_QUOTATION_DRAFT,
  buildQuotationDraftPrompt,
} from '../prompts/quotation-draft.prompt.js';
import { parseAndNormalizeDraft } from '../schemas/quotation-draft.schema.js';
import { GEMINI_QUOTATION_DRAFT_SCHEMA } from '../schemas/quotation-draft-gemini.schema.js';
import { cleanJsonText } from '../utils/json-cleaner.util.js';
import { sanitizeAiError } from '../utils/ai-error-sanitizer.util.js';

@Injectable()
export class GeminiQuotationDraftExtractor implements QuotationDraftExtractor {
  private readonly logger = new Logger(GeminiQuotationDraftExtractor.name);
  private aiClient: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initClient();
  }

  private initClient(): void {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim();
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      this.initClient();
    }
    if (!this.aiClient) {
      this.logger.warn(
        'AI quotation draft is not configured (missing GEMINI_API_KEY).',
      );
      throw new ServiceUnavailableException(
        'AI quotation draft is not configured.',
      );
    }
    return this.aiClient;
  }

  async extract(rawRequest: string): Promise<ExtractedQuotationDraft> {
    const model = this.configService.get<string>('GEMINI_MODEL')?.trim();
    const timeoutMs = this.configService.get<number>(
      'AI_REQUEST_TIMEOUT_MS',
      120000,
    );

    if (!model) {
      this.logger.warn(
        'AI quotation draft is not configured (missing GEMINI_MODEL).',
      );
      throw new ServiceUnavailableException(
        'AI quotation draft is not configured.',
      );
    }

    const ai = this.getClient();
    const prompt = buildQuotationDraftPrompt(rawRequest);

    const rawOutput = await this.executeGeminiCall(
      ai,
      model,
      prompt,
      timeoutMs,
    );
    return this.parseAndValidate(rawOutput);
  }

  private async executeGeminiCall(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    timeoutMs: number,
  ): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_QUOTATION_DRAFT,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_QUOTATION_DRAFT_SCHEMA,
          abortSignal: AbortSignal.timeout(timeoutMs),
        },
      });

      const output =
        response.text ?? response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!output || !output.trim()) {
        this.logger.error('Gemini returned an empty response.');
        throw new BadGatewayException(
          'AI provider returned an invalid response.',
        );
      }

      return output;
    } catch (err: any) {
      if (err instanceof BadGatewayException) {
        throw err;
      }

      const isTimeout =
        err?.name === 'TimeoutError' ||
        err?.name === 'AbortError' ||
        (typeof err?.message === 'string' &&
          /timeout|aborted/i.test(err.message));

      if (isTimeout) {
        this.logger.error(`Gemini request timed out after ${timeoutMs}ms`);
        throw new GatewayTimeoutException(
          'AI quotation draft request timed out.',
        );
      }

      const safeErrMsg = sanitizeAiError(err);
      this.logger.error(`Gemini generation failed: ${safeErrMsg}`);

      const status = err?.status || err?.statusCode;
      if (
        status === 429 ||
        status === 503 ||
        /quota|resource_exhausted|unavailable/i.test(safeErrMsg)
      ) {
        throw new ServiceUnavailableException(
          'AI quotation draft is temporarily unavailable.',
        );
      }

      throw new BadGatewayException(
        'AI provider returned an invalid response.',
      );
    }
  }

  private parseAndValidate(rawOutput: string): ExtractedQuotationDraft {
    let parsedJson: unknown;
    try {
      const cleaned = cleanJsonText(rawOutput);
      parsedJson = JSON.parse(cleaned);
    } catch {
      this.logger.error('Failed to parse Gemini output as JSON.');
      throw new BadGatewayException(
        'AI provider returned an invalid response.',
      );
    }

    try {
      return parseAndNormalizeDraft(parsedJson);
    } catch (zodErr) {
      this.logger.error(
        `Zod validation failed on Gemini output: ${sanitizeAiError(zodErr)}`,
      );
      throw new BadGatewayException(
        'AI provider returned an invalid response.',
      );
    }
  }
}
