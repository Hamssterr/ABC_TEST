import { Type, Schema } from '@google/genai';

/**
 * Gemini responseSchema definition for structured JSON output from Gemini models.
 */
export const GEMINI_QUOTATION_DRAFT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          productQuery: { type: Type.STRING },
          quantity: { type: Type.STRING },
        },
        required: ['productQuery'],
      },
    },
    deliveryAddress: { type: Type.STRING },
    paymentTerms: { type: Type.STRING },
    validityDays: { type: Type.INTEGER },
    notes: { type: Type.STRING },
    unresolvedFields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['items'],
};
