export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  unit: string
  unitPrice: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  sku: string
  name: string
  description?: string | null
  unit: string
  unitPrice: string
  isActive?: boolean
}

export interface UpdateProductInput {
  sku?: string
  name?: string
  description?: string | null
  unit?: string
  unitPrice?: string
  isActive?: boolean
}

export interface ProductFormValues {
  sku: string
  name: string
  description?: string
  unit: string
  unitPrice: string
  isActive: boolean
}
