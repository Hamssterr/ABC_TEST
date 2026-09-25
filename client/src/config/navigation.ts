import { Users, Package, type LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  matchPrefix: string
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Khách hàng',
    href: '/customers',
    matchPrefix: '/customers',
    icon: Users,
  },
  {
    title: 'Sản phẩm',
    href: '/products',
    matchPrefix: '/products',
    icon: Package,
  },
]
