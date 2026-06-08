import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BreadcrumbNav from '../ui/BreadcrumbNav'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 60 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div style={{ flex: 1, marginLeft: sidebarWidth, transition: 'margin-left 0.3s ease' }}>
        <Topbar onMenuToggle={() => setCollapsed(!collapsed)} sidebarWidth={sidebarWidth} />
        <BreadcrumbNav sidebarWidth={sidebarWidth} />
        {/* padding-top: 56px (topbar) + 36px (breadcrumb) = 92px */}
        <main style={{ padding: '92px 24px 24px', minHeight: '100vh' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
