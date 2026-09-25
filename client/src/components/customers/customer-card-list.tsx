import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { CustomerActions } from './customer-actions'
import { Building2, Mail, Phone } from 'lucide-react'
import type { Customer } from '@/types/customer'

interface CustomerCardListProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerCardList({
  customers,
  onEdit,
  onDelete,
}: CustomerCardListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {customers.map((customer) => (
        <Card key={customer.id} className="shadow-xs hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {customer.code}
                </span>
                <h3 className="font-semibold text-base text-foreground mt-1.5 leading-snug">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {customer.name}
                  </Link>
                </h3>
              </div>
              <CustomerActions
                customer={customer}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
              {customer.companyName && (
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="truncate">{customer.companyName}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 font-mono">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
