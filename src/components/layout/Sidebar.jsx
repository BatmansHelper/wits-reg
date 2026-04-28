import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Plus, Users, Building2, Layers } from 'lucide-react'
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
            ? 'text-white border-l-[3px] border-wits-gold pl-[13px] bg-white/10'
            : 'text-white/60 border-l-[3px] border-transparent pl-[13px] hover:text-white hover:bg-white/5'
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
    <p className="px-4 pt-5 pb-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
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
      {/* Logo + App name */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/wits-regalia-logo.png"
            alt="WITS Regalia"
            className="h-9 w-9 object-contain rounded-lg flex-shrink-0"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <div>
            <p className="text-white font-bold text-sm leading-tight">WITS Regalia</p>
            <p className="text-white/40 text-[11px] mt-0.5">Order Process</p>
          </div>
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
        <p className="text-xs text-white/70 font-medium truncate">{userDoc?.displayName || userDoc?.email}</p>
        <p className="text-[11px] text-white/40 mt-0.5 capitalize">
          {userDoc?.role?.replace(/_/g, ' ')}
        </p>
      </div>
    </aside>
  )
}
