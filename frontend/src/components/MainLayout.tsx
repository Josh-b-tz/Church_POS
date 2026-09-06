import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import logoIglesia from '../assets/logo.png'
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  Boxes, 
  BarChart3, 
  Settings, 
  LogOut, 
  Store, 
  Search, 
  Bell, 
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN';

  // Configuración de rutas según permisos
const navigationItems = [
  { label: 'Inicio', path: '/', icon: Home, visible: true },
  { label: 'Ventas', path: '/caja', icon: ShoppingCart, visible: true },
  { label: 'Clientes & Billetera', path: '/clientes', icon: Users, visible: true },
  { label: 'Productos', path: '/productos', icon: Package, visible: isAdmin }, // <-- Redirección corregida
  { label: 'Inventario', path: '/inventario', icon: Boxes, visible: isAdmin },
  { label: 'Reportes', path: '/reportes', icon: BarChart3, visible: isAdmin },
  { label: 'Configuración', path: '/configuracion', icon: Settings, visible: isAdmin },
];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-700 font-sans overflow-hidden">
      {/* SIDEBAR IZQUIERDO */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-3">
            {/* Contenedor del Logotipo */}
            <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center p-1 shadow-xs border border-slate-100 shrink-0">
              <img 
                src={logoIglesia} 
                alt="Logo Avivando la Fe" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Textos Institucionales */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-[#1b5e20] tracking-tight leading-tight truncate uppercase">
                Avivando la fe
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Punto de Venta
              </span>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1">
            {navigationItems.filter(item => item.visible).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Sucursales y Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 cursor-pointer hover:bg-slate-100 transition">
            <div className="flex items-center gap-2.5">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-slate-600">
                <Store size={15} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">Tienda Central</p>
                <p className="text-[10px] text-slate-400">Sucursal Principal</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </div>

          <button 
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar productos, códigos o categorías..." 
              className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded-md">⌘K</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-slate-50 text-slate-500 transition">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="h-6 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/30">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isAdmin ? (
                    <ShieldCheck size={12} className="text-blue-600" />
                  ) : (
                    <UserCheck size={12} className="text-emerald-600" />
                  )}
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO INTERNO */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};