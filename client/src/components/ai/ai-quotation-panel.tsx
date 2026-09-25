import * as React from "react";
import { Sparkles, Bot, AlertCircle, RefreshCw, Wand2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/shared/async-button";
import { AiDraftSummary } from "./ai-draft-summary";
import {
  useAiQuotationDraft,
  getAiErrorMessage,
} from "@/hooks/use-ai-quotation-draft";
import type { QuotationDraft, ProductCandidate } from "@/types/ai";

interface AiQuotationPanelProps {
  customerId: string;
  onApplyDraft: (
    draft: QuotationDraft,
    selectedCandidateIds: Record<number, string>,
  ) => void;
  disabled?: boolean;
}

export function AiQuotationPanel({
  customerId,
  onApplyDraft,
  disabled = false,
}: AiQuotationPanelProps) {
  const [rawRequest, setRawRequest] = React.useState("");
  const [draft, setDraft] = React.useState<QuotationDraft | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<
    Record<number, string>
  >({});

  const aiMutation = useAiQuotationDraft();

  const charCount = rawRequest.length;
  const isTooLong = charCount > 5000;
  const isEmpty = rawRequest.trim().length === 0;

  const handleAnalyze = async () => {
    if (isEmpty || isTooLong || disabled) return;

    try {
      const response = await aiMutation.mutateAsync({
        customerId,
        rawRequest: rawRequest.trim(),
      });
      const result = response.data;
      setDraft(result);

      // Auto-select candidates for items with exactly 1 candidate
      const initialCandidateMap: Record<number, string> = {};
      result.items.forEach((item, index) => {
        if (item.candidates.length === 1) {
          initialCandidateMap[index] = item.candidates[0].id;
        }
      });
      setSelectedCandidateIds(initialCandidateMap);
    } catch {
      // Error handled via aiMutation.error display below
    }
  };

  const handleSelectCandidate = (
    itemIndex: number,
    candidate: ProductCandidate,
  ) => {
    setSelectedCandidateIds((prev) => ({
      ...prev,
      [itemIndex]: candidate.id,
    }));
  };

  const handleApply = () => {
    if (!draft) return;
    onApplyDraft(draft, selectedCandidateIds);
  };

  const handleReset = () => {
    setDraft(null);
    setSelectedCandidateIds({});
    aiMutation.reset();
  };

  return (
    <div className="space-y-4">
      {draft ? (
        <AiDraftSummary
          draft={draft}
          selectedCandidateIds={selectedCandidateIds}
          onSelectCandidate={handleSelectCandidate}
          onApply={handleApply}
          onReset={handleReset}
        />
      ) : (
        <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span>Trợ lý AI tạo bản nháp báo giá</span>
                    <span className="font-normal text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                      Gemini 3.5 Flash
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Dán nội dung yêu cầu báo giá từ khách hàng (email, tin nhắn
                    chat, ghi chú cuộc gọi). Trợ lý AI sẽ tự động phân tích sản
                    phẩm, số lượng, địa chỉ và điều khoản.
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="ai-raw-request"
                  className="font-medium text-foreground flex items-center gap-1.5">
                  <Bot className="size-3.5 text-primary" />
                  <span>Nội dung yêu cầu báo giá</span>
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      isTooLong
                        ? "text-destructive font-mono font-bold"
                        : "text-muted-foreground font-mono"
                    }>
                    {charCount}/5000 ký tự
                  </span>
                </div>
              </div>

              <Textarea
                id="ai-raw-request"
                value={rawRequest}
                onChange={(e) => setRawRequest(e.target.value)}
                placeholder="Ví dụ: Khách hàng cần đặt 2 chiếc Laptop Dell XPS, 3 màn hình Dell 27 inch 4K. Giao hàng tại địa chỉ 123 Cầu Giấy, Hà Nội. Thanh toán trong vòng 15 ngày..."
                rows={4}
                disabled={aiMutation.isPending || disabled}
                className="text-sm resize-y"
              />
            </div>

            {/* Error display */}
            {aiMutation.isError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{getAiErrorMessage(aiMutation.error)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground pl-6">
                  Bạn có thể bấm &ldquo;Thử lại&rdquo; hoặc hoàn toàn có thể
                  tiếp tục tự điền thông tin vào biểu mẫu thủ công bên dưới.
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
              {aiMutation.isError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  className="w-full sm:w-auto text-xs gap-1.5">
                  <RefreshCw className="size-3.5" />
                  <span>Thử lại</span>
                </Button>
              )}

              <AsyncButton
                type="button"
                onClick={handleAnalyze}
                isLoading={aiMutation.isPending}
                loadingText="AI đang phân tích..."
                disabled={isEmpty || isTooLong || disabled}
                className="w-full sm:w-auto gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs h-9 px-4">
                <Sparkles className="size-4" />
                <span>Phân tích bằng AI</span>
              </AsyncButton>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
