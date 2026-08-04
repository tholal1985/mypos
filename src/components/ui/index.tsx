import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 px-6 pt-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent'
}

export function StatCard({ label, value, icon, trend, trendUp, color = 'primary' }: StatCardProps) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
    accent: 'bg-accent-50 text-accent-600',
  }

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          {icon}
        </div>
        {trend && (
          <span className={cn('text-xs font-medium', trendUp ? 'text-success-600' : 'text-error-600')}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-xl w-full animate-slide-up', sizeMap[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

interface BadgeProps {
  children: React.ReactNode
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'blue'
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-success-100 text-success-700',
    yellow: 'bg-warning-100 text-warning-700',
    red: 'bg-error-100 text-error-700',
    blue: 'bg-primary-100 text-primary-700',
  }
  return <span className={cn('badge', colorMap[color])}>{children}</span>
}
