import * as React from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import {
  Send,
  Building2,
  Calendar,
  DollarSign,
  Percent,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AsyncButton } from "@/components/shared/async-button";
import { QuotationItemsField } from "./quotation-items-field";
import { QuotationSummary } from "./quotation-summary";
import {
  calculateQuotationPreview,
  type QuotationFormValues,
} from "@/schemas/quotation-schema";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";

export interface QuotationFormProps {
  form: UseFormReturn<QuotationFormValues>;
  customer: Customer;
  products: Product[];
  onSubmit: (values: QuotationFormValues) => void;
  isSubmitting: boolean;
  mode?: "manual" | "ai";
  submitLabel?: string;
  aiSlot?: React.ReactNode;
  extraProducts?: Product[];
}

export function QuotationForm({
  form,
  customer,
  products,
  onSubmit,
  isSubmitting,
  mode = "manual",
  submitLabel = "Gửi yêu cầu tạo báo giá",
  aiSlot,
  extraProducts = [],
}: QuotationFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const fieldArray = useFieldArray({
    control,
    name: "items",
  });

  // Watch form values for realtime Decimal calculation preview
  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discountAmount" });
  const watchedTaxRate = useWatch({ control, name: "taxRate" });

  const [dynamicProducts, setDynamicProducts] = React.useState<
    Record<string, Product>
  >({});

  // Map products by ID for fast lookup
  const productsMap = React.useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    for (const p of extraProducts) {
      map.set(p.id, p);
    }
    for (const p of Object.values(dynamicProducts)) {
      map.set(p.id, p);
    }
    return map;
  }, [products, extraProducts, dynamicProducts]);

  // Realtime Decimal calculation preview
  const calculation = React.useMemo(() => {
    const items = (watchedItems || []).map((item) => {
      const prod = item?.productId
        ? productsMap.get(item.productId)
        : undefined;
      return {
        productId: item?.productId || "",
        quantity: item?.quantity || "0",
        unitPrice: prod?.unitPrice || "0",
      };
    });
    return calculateQuotationPreview(items, watchedDiscount, watchedTaxRate);
  }, [watchedItems, watchedDiscount, watchedTaxRate, productsMap]);

  const handleProductSelect = (_index: number, product?: Product) => {
    if (product) {
      setDynamicProducts((prev) => ({ ...prev, [product.id]: product }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Optional AI Assistant Slot */}
      {mode === "ai" && aiSlot && <div className="space-y-4">{aiSlot}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Overview */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    Khách hàng thụ hưởng
                  </CardTitle>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {customer.code}
                </span>
              </div>
              <CardDescription className="text-xs">
                Thông tin khách hàng sẽ được snapshot lưu cố định kèm theo bản
                ghi báo giá này.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">
                  Tên khách hàng:
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {customer.name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Công ty:</span>
                <span className="font-medium text-foreground">
                  {customer.companyName || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Email:</span>
                <span className="font-medium text-foreground">
                  {customer.email || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">
                  Số điện thoại:
                </span>
                <span className="font-medium font-mono text-foreground">
                  {customer.phone || "—"}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground block">Địa chỉ:</span>
                <span className="font-medium text-foreground">
                  {customer.address || "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quotation Line Items */}
          <Card className="shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <QuotationItemsField
                control={control}
                setValue={setValue}
                fieldArray={fieldArray}
                errors={errors}
                productsMap={productsMap}
                onProductSelect={handleProductSelect}
                lineTotals={calculation.lineTotals}
                isSubmitting={isSubmitting}
                extraProducts={extraProducts}
              />
            </CardContent>
          </Card>

          {/* Additional Terms and Parameters */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Điều khoản & Thông số thanh toán
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Discount */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="discountAmount"
                    className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <DollarSign className="size-3.5 text-primary" />
                    <span>Chiết khấu (VNĐ)</span>
                  </label>
                  <Input
                    id="discountAmount"
                    {...register("discountAmount")}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="font-mono text-sm"
                  />
                  {errors.discountAmount && (
                    <p className="text-xs text-destructive">
                      {errors.discountAmount.message}
                    </p>
                  )}
                </div>

                {/* Tax Rate */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="taxRate"
                    className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Percent className="size-3.5 text-primary" />
                    <span>Thuế suất VAT (%)</span>
                  </label>
                  <Input
                    id="taxRate"
                    {...register("taxRate")}
                    type="text"
                    inputMode="decimal"
                    placeholder="10.00"
                    disabled={isSubmitting}
                    className="font-mono text-sm"
                  />
                  {errors.taxRate && (
                    <p className="text-xs text-destructive">
                      {errors.taxRate.message}
                    </p>
                  )}
                </div>

                {/* Valid until */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="validUntil"
                    className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    <span>
                      Ngày hết hạn <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <Input
                    id="validUntil"
                    {...register("validUntil")}
                    type="date"
                    disabled={isSubmitting}
                    className="text-sm"
                  />
                  {errors.validUntil && (
                    <p className="text-xs text-destructive">
                      {errors.validUntil.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="deliveryAddress"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Địa chỉ giao hàng</span>
                </label>
                <Input
                  id="deliveryAddress"
                  {...register("deliveryAddress")}
                  placeholder="Nhập địa chỉ giao nhận (nếu khác địa chỉ đăng ký)..."
                  disabled={isSubmitting}
                  className="text-sm"
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-1.5">
                <label
                  htmlFor="paymentTerms"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-primary" />
                  <span>Điều khoản thanh toán</span>
                </label>
                <Input
                  id="paymentTerms"
                  {...register("paymentTerms")}
                  placeholder="Ví dụ: Thanh toán 100% trong vòng 30 ngày sau khi giao nhận..."
                  disabled={isSubmitting}
                  className="text-sm"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="quotationNotes"
                  className="text-xs font-medium text-foreground">
                  Ghi chú báo giá
                </label>
                <Textarea
                  id="quotationNotes"
                  {...register("notes")}
                  placeholder="Ghi chú thêm về vận chuyển, bảo hành, cam kết chất lượng..."
                  disabled={isSubmitting}
                  rows={3}
                  className="text-sm resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary Column */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <QuotationSummary
            calculation={calculation}
            actionsSlot={
              <div className="space-y-2 pt-2">
                <AsyncButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Đang gửi yêu cầu..."
                  disabled={calculation.isDiscountExceeded}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-11">
                  <Send className="size-4" />
                  <span>{submitLabel}</span>
                </AsyncButton>
              </div>
            }
          />
        </div>
      </div>
    </form>
  );
}
