import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Boxes, 
  BarChart3, 
  UtensilsCrossed, 
  ChevronRight 
} from 'lucide-react';

export default function HomePage() {
    
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const modulos = [
    {
      titulo: 'Punto de Venta',
      descripcion: 'Registrar ventas, cobro de pedidos y órdenes en caja',
      icono: ShoppingCart,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      ruta: '/caja',
      visible: true
    },
    {
      titulo: 'Clientes & Billetera',
      descripcion: 'Control de hermanos, saldos virtuales y recargas',
      icono: Users,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      ruta: '/clientes',
      visible: true
    },
    {
      titulo: 'Inventario',
      descripcion: 'Control de existencias y reabastecimiento en bodega',
      icono: Boxes,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      ruta: '/inventario',
      visible: isAdmin
    },
    {
      titulo: 'Productos',
      descripcion: 'Precios, categorías y menús activos',
      icono: Package,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      ruta: '/admin/productos',
      visible: isAdmin
    },
    {
      titulo: 'Reportes',
      descripcion: 'Descarga de cierres de venta en formato Excel',
      icono: BarChart3,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      ruta: '/reportes',
      visible: isAdmin
    },
    {
      titulo: 'Monitor de Cocina',
      descripcion: 'Comandero aislado en vivo para preparación de alimentos',
      icono: UtensilsCrossed,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      ruta: '/cocina',
      visible: true
    }
  ];

    useEffect(() => {
    if (user?.role === 'COCINA') {
        navigate('/cocina', { replace: true });
    }
    }, [user, navigate]);


  return (
    <MainLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
          <p className="text-xs text-slate-500 mt-1">
            Bienvenido, selecciona una de las opciones operativas asignadas a tu rol.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modulos.filter(m => m.visible).map((item) => {
            const IconComponent = item.icono;
            return (
              <div
                key={item.titulo}
                onClick={() => navigate(item.ruta)}
                className="group bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${item.color} transition group-hover:scale-105`}>
                      <IconComponent size={22} />
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {item.descripcion}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>Acceso rápido</span>
                  <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Ingresar →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}