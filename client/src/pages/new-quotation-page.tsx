import * as React from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, FileEdit } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { QuotationForm } from "@/components/quotations/quotation-form";
import { AiQuotationPanel } from "@/components/ai/ai-quotation-panel";
import {
  quotationFormSchema,
  toCreateQuotationPayload,
  type QuotationFormValues,
} from "@/schemas/quotation-schema";
import { convertValidityDaysToDate } from "@/schemas/ai-quotation-schema";
import { useCustomer } from "@/hooks/use-customers";
import { useProducts } from "@/hooks/use-products";
import { useCreateQuotation } from "@/hooks/use-create-quotation";
import { showErrorToast } from "@/lib/error-toast";
import type { QuotationDraft } from "@/types/ai";
import type { Product } from "@/types/product";

export default function NewQuotationPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawMode = searchParams.get("mode");
  const mode = rawMode === "ai" ? "ai" : "manual";

  // When in AI mode, hide main form initially until user clicks "Áp dụng vào biểu mẫu"
  const [isFormVisible, setIsFormVisible] = React.useState(mode !== "ai");
  const formSectionRef = React.useRef<HTMLDivElement>(null);

  // Additional products collected from AI candidates that might not be in top 100 catalog
  const [extraProducts, setExtraProducts] = React.useState<Product[]>([]);

  // 1. Fetch customer details
  const {
    data: customerData,
    isLoading: isCustomerLoading,
    isError: isCustomerError,
    refetch: refetchCustomer,
  } = useCustomer(customerId);
  const customer = customerData?.data;

  // 2. Fetch catalog products (page 1, limit 100 for fast client selection)
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts({ page: 1, limit: 100 });
  const products = React.useMemo(() => {
    return (productsData?.data ?? []).filter((p) => p.isActive);
  }, [productsData]);

  // 3. Mutation hook
  const createQuotationMutation = useCreateQuotation(customerId ?? "");

  // 4. Form setup with default values
  const defaultValidUntil = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      items: [{ productId: "", quantity: "1" }],
      discountAmount: "0.00",
      taxRate: "10.00",
      validUntil: defaultValidUntil,
      deliveryAddress: "",
      paymentTerms: "Thanh toán trong vòng 30 ngày kể từ ngày giao nhận",
      notes: "",
    },
  });

  // Set default delivery address once customer profile is loaded
  React.useEffect(() => {
    if (customer?.address && !form.getValues("deliveryAddress")) {
      form.setValue("deliveryAddress", customer.address);
    }
  }, [customer, form]);

  // Apply AI Draft into form values
  const handleApplyDraft = (
    draft: QuotationDraft,
    selectedCandidateIds: Record<number, string>,
  ) => {
    // 1. Collect candidates and build valid form items (ONLY items that have candidate)
    const newExtraProducts: Product[] = [];
    const validFormItems: { productId: string; quantity: string }[] = [];

    draft.items.forEach((item, index) => {
      let chosenCandidate = null;
      if (item.candidates.length === 1) {
        chosenCandidate = item.candidates[0];
      } else if (item.candidates.length > 1) {
        const selectedId = selectedCandidateIds[index];
        chosenCandidate =
          item.candidates.find((c) => c.id === selectedId) || null;
      }

      // Only add to Product and Form if there is a valid candidate
      if (chosenCandidate) {
        newExtraProducts.push({
          id: chosenCandidate.id,
          sku: chosenCandidate.sku,
          name: chosenCandidate.name,
          description: chosenCandidate.description ?? null,
          unit: chosenCandidate.unit,
          unitPrice: chosenCandidate.unitPrice,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        });

        validFormItems.push({
          productId: chosenCandidate.id,
          quantity:
            item.quantity && Number(item.quantity) > 0 ? item.quantity : "1",
        });
      }
    });

    if (newExtraProducts.length > 0) {
      setExtraProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of newExtraProducts) {
          if (!existingIds.has(p.id)) {
            merged.push(p);
            existingIds.add(p.id);
          }
        }
        return merged;
      });
    }

    // 2. Set items into form
    if (validFormItems.length > 0) {
      form.setValue("items", validFormItems, { shouldValidate: true });
    } else {
      form.setValue("items", [{ productId: "", quantity: "1" }], {
        shouldValidate: true,
      });
      toast.info(
        "Không có sản phẩm nào trong bản nháp khớp với danh mục kho. Vui lòng tự chọn sản phẩm.",
      );
    }

    // 3. Map parameters
    if (draft.deliveryAddress) {
      form.setValue("deliveryAddress", draft.deliveryAddress);
    }

    if (draft.paymentTerms) {
      form.setValue("paymentTerms", draft.paymentTerms);
    }

    const convertedDate = convertValidityDaysToDate(draft.validityDays);
    if (convertedDate) {
      form.setValue("validUntil", convertedDate, { shouldValidate: true });
    }

    if (draft.notes) {
      form.setValue("notes", draft.notes);
    }

    // Show main form
    setIsFormVisible(true);

    toast.success(
      "Đã áp dụng bản nháp AI vào biểu mẫu! Vui lòng kiểm tra lại thông tin trước khi gửi.",
    );

    // Smooth scroll down to the form for user review
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  };

  const handleSubmit = async (values: QuotationFormValues) => {
    try {
      const payload = toCreateQuotationPayload(values);
      const response = await createQuotationMutation.mutateAsync(payload);
      const result = response.data;

      toast.success(
        `Đã tạo báo giá ${result.quotationNumber}! Hệ thống đang tiến hành xử lý...`,
      );

      // Navigate to quotation detail with jobId in state for instantaneous polling setup
      navigate(`/quotations/${result.quotationId}`, {
        state: { jobId: result.jobId },
      });
    } catch (error) {
      showErrorToast(error, {
        fallbackMessage:
          "Không thể tạo báo giá. Vui lòng kiểm tra lại thông tin và thử lại.",
      });
    }
  };

  if (isCustomerLoading || isProductsLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </PageContainer>
    );
  }

  if (isCustomerError || !customer) {
    return (
      <PageContainer>
        <PageHeader
          title="Không tìm thấy khách hàng"
          breadcrumbs={[
            { label: "Khách hàng", href: "/customers" },
            { label: "Tạo báo giá" },
          ]}
        />
        <ErrorState
          title="Không tìm thấy thông tin khách hàng"
          message="Khách hàng được yêu cầu không tồn tại hoặc đã bị xóa."
          onRetry={() => void refetchCustomer()}
        />
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link to="/customers" className="gap-2">
              <ArrowLeft className="size-4" />
              <span>Quay lại danh sách khách hàng</span>
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (isProductsError) {
    return (
      <PageContainer>
        <PageHeader
          title="Lỗi tải danh mục sản phẩm"
          breadcrumbs={[
            { label: "Khách hàng", href: "/customers" },
            { label: customer.code, href: `/customers/${customer.id}` },
            { label: "Tạo báo giá" },
          ]}
        />
        <ErrorState
          title="Không thể tải danh mục sản phẩm"
          message="Không thể nạp danh mục sản phẩm để tạo báo giá. Vui lòng thử lại sau."
          onRetry={() => void refetchProducts()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={mode === "ai" ? "Tạo báo giá với Trợ lý AI" : "Tạo báo giá mới"}
        description={`Tạo báo giá cho khách hàng ${customer.name} (${customer.code})`}
        breadcrumbs={[
          { label: "Khách hàng", href: "/customers" },
          { label: customer.code, href: `/customers/${customer.id}` },
          { label: mode === "ai" ? "Báo giá AI" : "Tạo báo giá" },
        ]}
        action={
          <Button variant="outline" asChild size="sm">
            <Link to={`/customers/${customer.id}`} className="gap-1.5">
              <ArrowLeft className="size-4" />
              <span>Quay lại chi tiết</span>
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        {mode === "ai" && (
          <AiQuotationPanel
            customerId={customer.id}
            onApplyDraft={handleApplyDraft}
            disabled={createQuotationMutation.isPending}
          />
        )}

        {mode === "ai" && !isFormVisible && (
          <div className="flex items-center justify-center p-6 border border-dashed rounded-lg bg-muted/20 text-center">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Biểu mẫu chi tiết sẽ tự động xuất hiện sau khi bạn áp dụng bản
                nháp AI.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormVisible(true)}
                className="gap-1.5 text-xs">
                <FileEdit className="size-3.5" />
                <span>Hoặc tự điền biểu mẫu thủ công ngay</span>
              </Button>
            </div>
          </div>
        )}

        {isFormVisible && (
          <div
            ref={formSectionRef}
            className="animate-in fade-in-50 duration-300">
            <QuotationForm
              form={form}
              customer={customer}
              products={products}
              onSubmit={handleSubmit}
              isSubmitting={createQuotationMutation.isPending}
              mode={mode}
              submitLabel="Gửi yêu cầu tạo báo giá"
              extraProducts={extraProducts}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
