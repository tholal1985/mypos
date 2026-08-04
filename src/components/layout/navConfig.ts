import { LayoutDashboard, ShoppingCart, Package, FolderTree, Tag, Scale, Receipt, ListOrdered, Users, Truck, Wallet, ChartBar as BarChart3, Landmark, ArrowLeftRight, UserPlus, Wrench, Factory, FolderKanban, Boxes, Dumbbell, FileText, Globe, MapPin, HeartPulse, ScrollText, Crown, FileCheck, Inbox, LayoutGrid, Plug, ShoppingBag, Sparkles, FileSpreadsheet, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  group: string
}

export const icons: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'main' },
  { label: 'POS / Sell', path: '/pos', icon: ShoppingCart, group: 'main' },

  { label: 'Products', path: '/products', icon: Package, group: 'inventory' },
  { label: 'Categories', path: '/categories', icon: FolderTree, group: 'inventory' },
  { label: 'Brands', path: '/brands', icon: Tag, group: 'inventory' },
  { label: 'Units', path: '/units', icon: Scale, group: 'inventory' },
  { label: 'Catalogues', path: '/catalogues', icon: BookOpen, group: 'inventory' },
  { label: 'Import/Export', path: '/spreadsheet', icon: FileSpreadsheet, group: 'inventory' },

  { label: 'Sales', path: '/sales', icon: Receipt, group: 'sales' },
  { label: 'Purchases', path: '/purchases', icon: ListOrdered, group: 'sales' },
  { label: 'Expenses', path: '/expenses', icon: Wallet, group: 'sales' },
  { label: 'E-Commerce', path: '/ecommerce', icon: Globe, group: 'sales' },
  { label: 'Cheques', path: '/cheques', icon: ScrollText, group: 'sales' },

  { label: 'Customers', path: '/customers', icon: Users, group: 'contacts' },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, group: 'contacts' },

  { label: 'Reports', path: '/reports', icon: BarChart3, group: 'finance' },
  { label: 'Accounts', path: '/accounts', icon: Landmark, group: 'finance' },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight, group: 'finance' },
  { label: 'Superadmin', path: '/superadmin', icon: Crown, group: 'finance' },

  { label: 'CRM Leads', path: '/crm', icon: UserPlus, group: 'modules' },
  { label: 'Repair Jobs', path: '/repair', icon: Wrench, group: 'modules' },
  { label: 'Manufacturing', path: '/manufacturing', icon: Factory, group: 'modules' },
  { label: 'Projects', path: '/projects', icon: FolderKanban, group: 'modules' },
  { label: 'Assets', path: '/assets', icon: Boxes, group: 'modules' },
  { label: 'Gym Members', path: '/gym', icon: Dumbbell, group: 'modules' },
  { label: 'CMS Pages', path: '/cms', icon: FileText, group: 'modules' },
  { label: 'Field Force', path: '/field-force', icon: MapPin, group: 'modules' },
  { label: 'Hospital (HMS)', path: '/hms', icon: HeartPulse, group: 'modules' },
  { label: 'ZATCA', path: '/zatca', icon: FileCheck, group: 'modules' },
  { label: 'Inbox', path: '/inbox', icon: Inbox, group: 'modules' },
  { label: 'Custom Dashboards', path: '/custom-dashboards', icon: LayoutGrid, group: 'modules' },
  { label: 'Connectors', path: '/connectors', icon: Plug, group: 'modules' },
  { label: 'WooCommerce', path: '/woocommerce', icon: ShoppingBag, group: 'modules' },
  { label: 'AI Assistant', path: '/ai', icon: Sparkles, group: 'modules' },
]
