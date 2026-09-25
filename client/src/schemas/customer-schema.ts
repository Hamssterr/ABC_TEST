import { z } from 'zod'
import type {
  CustomerFormValues,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/types/customer'

export const customerSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Mã khách hàng không được để trống')
    .max(50, 'Mã khách hàng không được vượt quá 50 ký tự'),
  name: z
    .string()
    .trim()
    .min(1, 'Tên khách hàng không được để trống')
    .max(255, 'Tên khách hàng không được vượt quá 255 ký tự'),
  companyName: z
    .string()
    .trim()
    .max(255, 'Tên công ty không được vượt quá 255 ký tự')
    .optional(),
  email: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: 'Email không đúng định dạng hợp lệ' }
    )
    .optional(),
  phone: z
    .string()
    .trim()
    .max(50, 'Số điện thoại không được vượt quá 50 ký tự')
    .optional(),
  address: z.string().trim().optional(),
})

export function toCreateCustomerPayload(
  values: CustomerFormValues
): CreateCustomerInput {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    companyName: values.companyName?.trim() || null,
    email: values.email?.trim() ? values.email.trim().toLowerCase() : null,
    phone: values.phone?.trim() || null,
    address: values.address?.trim() || null,
  }
}

export function toUpdateCustomerPayload(
  values: CustomerFormValues
): UpdateCustomerInput {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    companyName: values.companyName?.trim() ? values.companyName.trim() : null,
    email: values.email?.trim() ? values.email.trim().toLowerCase() : null,
    phone: values.phone?.trim() ? values.phone.trim() : null,
    address: values.address?.trim() ? values.address.trim() : null,
  }
}
