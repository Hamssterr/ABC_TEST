export interface Customer {
  id: string
  code: string
  name: string
  companyName: string | null
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerInput {
  code: string
  name: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface UpdateCustomerInput {
  code?: string
  name?: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface CustomerFormValues {
  code: string
  name: string
  companyName?: string
  email?: string
  phone?: string
  address?: string
}
