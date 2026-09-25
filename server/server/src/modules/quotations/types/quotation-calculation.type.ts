export interface QuotationCalculationItem {
  productId: string;
  productSku: string;
  productName: string;
  description: string | null;
  unit: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

export interface QuotationCalculationResult {
  items: QuotationCalculationItem[];
  subtotal: string;
  discountAmount: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
}
