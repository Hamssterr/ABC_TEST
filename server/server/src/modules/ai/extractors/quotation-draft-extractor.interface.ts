export interface ExtractedItem {
  productQuery: string;
  quantity: string | null;
}

export interface ExtractedQuotationDraft {
  items: ExtractedItem[];
  deliveryAddress: string | null;
  paymentTerms: string | null;
  validityDays: number | null;
  notes: string | null;
  unresolvedFields: string[];
}

export interface QuotationDraftExtractor {
  extract(rawRequest: string): Promise<ExtractedQuotationDraft>;
}
