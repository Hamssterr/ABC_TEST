import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../products/products.service.js';
import type { ExtractedQuotationDraft } from '../extractors/quotation-draft-extractor.interface.js';
import { QuotationDraftResponseDto } from '../dto/quotation-draft-response.dto.js';
import { QuotationDraftItemDto } from '../dto/quotation-draft-item.dto.js';

@Injectable()
export class QuotationCandidateMatcherService {
  constructor(private readonly productsService: ProductsService) {}

  async matchCandidatesAndFields(
    extracted: ExtractedQuotationDraft,
  ): Promise<QuotationDraftResponseDto> {
    // 1. Normalize items, cap at maximum 20 items to prevent oversized payloads
    const cappedItems = (extracted.items || []).slice(0, 20);
    const unresolvedSet = new Set<string>(extracted.unresolvedFields || []);

    // 2. Product candidate matching for each item concurrently
    const matchedItems: QuotationDraftItemDto[] = await Promise.all(
      cappedItems.map(async (item) => {
        const itemDto = new QuotationDraftItemDto();
        itemDto.productQuery = item.productQuery;
        itemDto.quantity = item.quantity;

        const candidates = await this.productsService.findActiveCandidates(
          item.productQuery,
          5,
        );
        itemDto.candidates = candidates;

        if (candidates.length === 0) {
          unresolvedSet.add(
            `Không tìm thấy sản phẩm phù hợp trong hệ thống cho "${item.productQuery}"`,
          );
        } else if (candidates.length > 1) {
          unresolvedSet.add(
            `Tìm thấy ${candidates.length} sản phẩm tương tự cho "${item.productQuery}". Vui lòng chọn sản phẩm chính xác.`,
          );
        }

        if (item.quantity === null) {
          unresolvedSet.add(
            `Thiếu số lượng cho sản phẩm "${item.productQuery}"`,
          );
        }

        return itemDto;
      }),
    );

    // 3. Check missing general quotation fields
    if (matchedItems.length === 0) {
      unresolvedSet.add(
        'Chưa xác định được sản phẩm nào từ yêu cầu của khách hàng',
      );
    }

    if (!extracted.deliveryAddress) {
      unresolvedSet.add('Thiếu địa chỉ giao hàng');
    }

    if (!extracted.paymentTerms) {
      unresolvedSet.add('Thiếu điều khoản thanh toán');
    }

    if (extracted.validityDays === null) {
      unresolvedSet.add('Thiếu thời hạn hiệu lực báo giá');
    }

    return {
      items: matchedItems,
      deliveryAddress: extracted.deliveryAddress,
      paymentTerms: extracted.paymentTerms,
      validityDays: extracted.validityDays,
      notes: extracted.notes,
      unresolvedFields: Array.from(unresolvedSet),
    };
  }
}
