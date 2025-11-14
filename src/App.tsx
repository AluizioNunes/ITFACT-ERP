import './App.css'
import { Layout, Menu, theme } from 'antd'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Dashboard from './pages/Dashboard'
import ClientsPage from './pages/Clients'
import MaterialsPage from './pages/Materials'
import ServicesPage from './pages/Services'
import BudgetsPage from './pages/Budgets'
import CRMPage from './pages/CRM'
import SuppliersPage from './pages/Suppliers'
import CatalogosPage from './pages/Catalogos'

const { Header, Content } = Layout

type RouteItem = { key: string; label: string; path: string }
const routeItems: RouteItem[] = [
  { key: 'dashboard', label: 'DASHBOARD', path: '/' },
  { key: 'clients', label: 'CLIENTES', path: '/clients' },
  { key: 'materials', label: 'MATERIAIS', path: '/materials' },
  { key: 'services', label: 'SERVIÇOS', path: '/services' },
  { key: 'budgets', label: 'ORÇAMENTOS', path: '/budgets' },
  { key: 'suppliers', label: 'FORNECEDORES', path: '/suppliers' },
  { key: 'crm', label: 'CRM', path: '/crm' },
  { key: 'catalogos', label: 'CATÁLOGOS', path: '/catalogos' },
]

function App(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const selectedKey = routeItems.find((r) => r.path === location.pathname)?.key || 'dashboard'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <Header style={{ background: '#001529', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>ITFACT ERP</div>
      </Header>
      {/* Menu horizontal abaixo */}
      <div style={{ background: colorBgContainer }}>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={routeItems}
          onClick={({ key }) => {
            const item = routeItems.find((i) => i.key === key)
            if (item) navigate(item.path)
          }}
        />
      </div>

      <Content style={{ margin: '16px' }}>
        <div style={{ padding: 16, minHeight: 'calc(100vh - 160px)', background: colorBgContainer }}>
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/catalogos" element={<CatalogosPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </Content>
    </Layout>
  )
}

export default App
