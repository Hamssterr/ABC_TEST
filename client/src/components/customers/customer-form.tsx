import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  customerSchema,
  toCreateCustomerPayload,
  toUpdateCustomerPayload,
} from '@/schemas/customer-schema'
import type { Customer, CustomerFormValues } from '@/types/customer'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers'

interface CustomerFormProps {
  customer?: Customer | null
  formId: string
  onSuccess: () => void
  setIsSubmitting: (isSubmitting: boolean) => void
}

export function CustomerForm({
  customer,
  formId,
  onSuccess,
  setIsSubmitting,
}: CustomerFormProps) {
  const isEditing = Boolean(customer)

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: customer?.code ?? '',
      name: customer?.name ?? '',
      companyName: customer?.companyName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
    },
  })

  // Reset form whenever active customer changes
  React.useEffect(() => {
    form.reset({
      code: customer?.code ?? '',
      name: customer?.name ?? '',
      companyName: customer?.companyName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
    })
  }, [customer, form])

  const createMutation = useCreateCustomer({
    onSuccess: () => {
      form.reset()
      onSuccess()
    },
  })

  const updateMutation = useUpdateCustomer({
    onSuccess: () => {
      onSuccess()
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  React.useEffect(() => {
    setIsSubmitting(isPending)
  }, [isPending, setIsSubmitting])

  const onSubmit = (values: CustomerFormValues) => {
    if (isEditing && customer) {
      const payload = toUpdateCustomerPayload(values)
      updateMutation.mutate({ id: customer.id, input: payload })
    } else {
      const payload = toCreateCustomerPayload(values)
      createMutation.mutate(payload)
    }
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mã khách hàng <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: CUS-001"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  disabled={isPending}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tên khách hàng <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Nguyễn Văn A"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên công ty</FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Công ty TNHH Hoàng Kim"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contact@company.com"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="0912345678"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Địa chỉ trụ sở hoặc giao hàng"
                  rows={3}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
