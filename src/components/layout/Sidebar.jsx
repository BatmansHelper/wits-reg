import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Plus,
  Users,
  Building2,
  Settings,
  Layers,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { isSuperAdmin, canCreateOrder } from '../../utils/roleChecks'

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'text-white border-l-[3px] border-wits-gold pl-[13px]'
            : 'text-gray-400 border-l-[3px] border-transparent pl-[13px] hover:text-white'
        }`
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  )
}

function SectionLabel({ label }) {
  return (
    <p className="px-4 pt-5 pb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
      {label}
    </p>
  )
}

export default function Sidebar() {
  const { userDoc } = useAuth()
  const superAdmin = isSuperAdmin(userDoc)
  const canCreate = canCreateOrder(userDoc)

  return (
    <aside className="w-56 bg-sidebar flex-shrink-0 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <img
          src="/wits-logo.png"
          alt="WITS University"
          className="h-10 w-auto object-contain mb-3"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm tracking-wide">WROP</span>
          <span className="text-gray-500 text-xs mt-0.5">Order Process</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
        <NavItem to="/orders" icon={Package} label="Orders" />
        {canCreate && (
          <NavItem to="/orders/new" icon={Plus} label="New Order" />
        )}

        {superAdmin && (
          <>
            <SectionLabel label="Admin" />
            <NavItem to="/admin/users" icon={Users} label="Users" />
            <NavItem to="/admin/universities" icon={Building2} label="Universities" />
            <NavItem to="/admin/step-builder" icon={Layers} label="Step Builder" />
          </>
        )}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-gray-400 truncate">{userDoc?.displayName || userDoc?.email}</p>
        <p className="text-xs text-gray-600 mt-0.5 capitalize">
          {userDoc?.role?.replace(/_/g, ' ')}
        </p>
      </div>
    </aside>
  )
}
