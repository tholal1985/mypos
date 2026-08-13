import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import AppLayout from '@/components/layout/AppLayout'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Products = lazy(() => import('@/pages/products/Products'))
const Categories = lazy(() => import('@/pages/products/Categories'))
const Brands = lazy(() => import('@/pages/products/Brands'))
const Units = lazy(() => import('@/pages/products/Units'))
const ProductCatalogue = lazy(() => import('@/pages/catalogue/ProductCatalogue'))
const Spreadsheet = lazy(() => import('@/pages/spreadsheet/Spreadsheet'))
const POS = lazy(() => import('@/pages/pos/POS'))
const Sales = lazy(() => import('@/pages/sales/Sales'))
const SaleDetail = lazy(() => import('@/pages/sales/SaleDetail'))
const Customers = lazy(() => import('@/pages/contacts/Customers'))
const Suppliers = lazy(() => import('@/pages/contacts/Suppliers'))
const Purchases = lazy(() => import('@/pages/purchases/Purchases'))
const Expenses = lazy(() => import('@/pages/expenses/Expenses'))
const EcommerceOrders = lazy(() => import('@/pages/ecommerce/EcommerceOrders'))
const Cheques = lazy(() => import('@/pages/cheque/Cheques'))
const Reports = lazy(() => import('@/pages/reports/Reports'))
const Accounts = lazy(() => import('@/pages/accounting/Accounts'))
const Transactions = lazy(() => import('@/pages/accounting/Transactions'))
const Superadmin = lazy(() => import('@/pages/superadmin/Superadmin'))
const CRMLeads = lazy(() => import('@/pages/crm/CRMLeads'))
const RepairJobs = lazy(() => import('@/pages/repair/RepairJobs'))
const Manufacturing = lazy(() => import('@/pages/manufacturing/Manufacturing'))
const Projects = lazy(() => import('@/pages/projects/Projects'))
const Assets = lazy(() => import('@/pages/assets/Assets'))
const GymMembers = lazy(() => import('@/pages/gym/GymMembers'))
const CMSPages = lazy(() => import('@/pages/cms/CMSPages'))
const FieldForce = lazy(() => import('@/pages/fieldforce/FieldForce'))
const HMS = lazy(() => import('@/pages/hms/HMS'))
const ZatcaInvoices = lazy(() => import('@/pages/zatca/ZatcaInvoices'))
const InboxReport = lazy(() => import('@/pages/inbox/InboxReport'))
const CustomDashboard = lazy(() => import('@/pages/dashboard/CustomDashboard'))
const Connectors = lazy(() => import('@/pages/connector/Connectors'))
const WooCommerce = lazy(() => import('@/pages/woocommerce/WooCommerce'))
const AIAssistance = lazy(() => import('@/pages/ai/AIAssistance'))
const Settings = lazy(() => import('@/pages/settings/Settings'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
}

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {user ? (
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/units" element={<Units />} />
              <Route path="/catalogues" element={<ProductCatalogue />} />
              <Route path="/spreadsheet" element={<Spreadsheet />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/sales/:id" element={<SaleDetail />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/ecommerce" element={<EcommerceOrders />} />
              <Route path="/cheques" element={<Cheques />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/superadmin" element={<Superadmin />} />
              <Route path="/crm" element={<CRMLeads />} />
              <Route path="/repair" element={<RepairJobs />} />
              <Route path="/manufacturing" element={<Manufacturing />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/gym" element={<GymMembers />} />
              <Route path="/cms" element={<CMSPages />} />
              <Route path="/field-force" element={<FieldForce />} />
              <Route path="/hms" element={<HMS />} />
              <Route path="/zatca" element={<ZatcaInvoices />} />
              <Route path="/inbox" element={<InboxReport />} />
              <Route path="/custom-dashboards" element={<CustomDashboard />} />
              <Route path="/connectors" element={<Connectors />} />
              <Route path="/woocommerce" element={<WooCommerce />} />
              <Route path="/ai" element={<AIAssistance />} />
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
      </Suspense>
    </BrowserRouter>
  )
}
