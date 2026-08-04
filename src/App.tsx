import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Products from '@/pages/products/Products'
import Categories from '@/pages/products/Categories'
import Brands from '@/pages/products/Brands'
import Units from '@/pages/products/Units'
import POS from '@/pages/pos/POS'
import Sales from '@/pages/sales/Sales'
import SaleDetail from '@/pages/sales/SaleDetail'
import Customers from '@/pages/contacts/Customers'
import Suppliers from '@/pages/contacts/Suppliers'
import Purchases from '@/pages/purchases/Purchases'
import Expenses from '@/pages/expenses/Expenses'
import Reports from '@/pages/reports/Reports'
import Accounts from '@/pages/accounting/Accounts'
import Transactions from '@/pages/accounting/Transactions'
import CRMLeads from '@/pages/crm/CRMLeads'
import RepairJobs from '@/pages/repair/RepairJobs'
import Manufacturing from '@/pages/manufacturing/Manufacturing'
import Projects from '@/pages/projects/Projects'
import Assets from '@/pages/assets/Assets'
import GymMembers from '@/pages/gym/GymMembers'
import CMSPages from '@/pages/cms/CMSPages'
import Settings from '@/pages/settings/Settings'

export default function App() {
  const { loading, user, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading FASEYHA POS...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/units" element={<Units />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/:id" element={<SaleDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/crm" element={<CRMLeads />} />
            <Route path="/repair" element={<RepairJobs />} />
            <Route path="/manufacturing" element={<Manufacturing />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/gym" element={<GymMembers />} />
            <Route path="/cms" element={<CMSPages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
