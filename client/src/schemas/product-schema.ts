import { z } from 'zod'
import Decimal from 'decimal.js'
import type {
  ProductFormValues,
  CreateProductInput,
  UpdateProductInput,
} from '@/types/product'

const DECIMAL_STRING_REGEX = /^\d+(\.\d{1,2})?$/

export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'Mã SKU sản phẩm không được để trống')
    .max(50, 'Mã SKU không được vượt quá 50 ký tự'),
  name: z
    .string()
    .trim()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(255, 'Tên sản phẩm không được vượt quá 255 ký tự'),
  description: z.string().trim().optional(),
  unit: z
    .string()
    .trim()
    .min(1, 'Đơn vị tính không được để trống')
    .max(50, 'Đơn vị tính không được vượt quá 50 ký tự'),
  unitPrice: z
    .string()
    .trim()
    .min(1, 'Đơn giá không được để trống')
    .refine((val) => DECIMAL_STRING_REGEX.test(val), {
      message: 'Đơn giá phải là số không âm (tối đa 2 chữ số thập phân)',
    })
    .refine(
      (val) => {
        try {
          const d = new Decimal(val)
          return d.gte(0)
        } catch {
          return false
        }
      },
      { message: 'Đơn giá không hợp lệ' }
    ),
  isActive: z.boolean(),
})

export function toCreateProductPayload(
  values: ProductFormValues
): CreateProductInput {
  return {
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description?.trim() || null,
    unit: values.unit.trim(),
    unitPrice: new Decimal(values.unitPrice.trim()).toFixed(2),
    isActive: values.isActive,
  }
}

export function toUpdateProductPayload(
  values: ProductFormValues
): UpdateProductInput {
  return {
    sku: values.sku.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    unit: values.unit.trim(),
    unitPrice: new Decimal(values.unitPrice.trim()).toFixed(2),
    isActive: values.isActive,
  }
}
