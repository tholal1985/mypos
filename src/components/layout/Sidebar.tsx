import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { icons, type NavItem } from './navConfig'
import { ChevronDown, Store, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar() {
  const { business, businesses, setBusiness, signOut, user } = useAuthStore()
  const navigate = useNavigate()
  const [showBusinessMenu, setShowBusinessMenu] = useState(false)

  const groupedNav: { group: string; items: NavItem[] }[] = [
    { group: 'Main', items: icons.filter(i => i.group === 'main') },
    { group: 'Inventory', items: icons.filter(i => i.group === 'inventory') },
    { group: 'Sales', items: icons.filter(i => i.group === 'sales') },
    { group: 'Contacts', items: icons.filter(i => i.group === 'contacts') },
    { group: 'Finance', items: icons.filter(i => i.group === 'finance') },
    { group: 'Modules', items: icons.filter(i => i.group === 'modules') },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">FASEYHA POS</p>
            <p className="text-xs text-gray-400">Point of Sale</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-200 relative">
        <button
          onClick={() => setShowBusinessMenu(!showBusinessMenu)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <p className="text-xs text-gray-400">Business</p>
            <p className="text-sm font-medium text-gray-900 truncate">{business?.name || 'Select'}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        {showBusinessMenu && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBusiness(b)
                  setShowBusinessMenu(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg',
                  b.id === business?.id && 'text-primary-600 font-medium'
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {groupedNav.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{group}</p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="truncate flex-1">{user?.email}</span>
        </div>
        <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
        <button
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-error-600 hover:bg-error-50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
