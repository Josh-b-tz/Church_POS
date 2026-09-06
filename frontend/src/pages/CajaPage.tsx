import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ChefHat, 
  Store, 
  UserCheck, 
  X,
  CreditCard,
  Banknote,
  Loader2
} from 'lucide-react';

interface Evento {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock?: number | null;
}

interface Cliente {
  id: number;
  nombre: string;
  saldo: number;
}

interface ItemCarrito extends Producto {
  cantidad: number;
}

export default function CajaPage() {
  const { request } = useAuth();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de Catálogo
  const [tabActiva, setTabActiva] = useState<'TODOS' | 'COCINA' | 'TIENDA'>('TODOS');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  // Carrito
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Pago y Clientes
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [modoPago, setModoPago] = useState<'EFECTIVO' | 'SALDO'>('EFECTIVO');
  const [nombreTemporal, setNombreTemporal] = useState('');

  // Blindaje contra cobros duplicados
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const respEvento = await request('/eventos/activo');
      setEvento(respEvento);

      if (respEvento && respEvento.id) {
        const respMenu = await request(`/productos/menu?eventoId=${respEvento.id}`);
        setProductos(respMenu);
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      Swal.fire({
        icon: 'error',
        title: 'Sistema Cerrado',
        text: 'No se encontró un evento activo o no tienes permisos de acceso.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Suma 1 producto por llamada respetando el stock disponible
  const agregarProducto = (producto: Producto) => {
    if (producto.stock !== null && producto.stock !== undefined && producto.stock <= 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Producto agotado',
        showConfirmButton: false,
        timer: 1500
      });
      return;
    }

    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        if (producto.stock !== null && producto.stock !== undefined && existe.cantidad >= producto.stock) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Stock máximo alcanzado',
            showConfirmButton: false,
            timer: 1200
          });
          return prev;
        }
        return prev.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const modificarCantidad = (id: number, delta: number) => {
    setCarrito(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad <= 0) return null;
            if (delta > 0 && item.stock !== null && item.stock !== undefined && nuevaCantidad > item.stock) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Stock no disponible',
                showConfirmButton: false,
                timer: 1000
              });
              return item;
            }
            return { ...item, cantidad: nuevaCantidad };
          }
          return item;
        })
        .filter(Boolean) as ItemCarrito[]
    );
  };

  const eliminarItem = (id: number) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const buscarCliente = async (query: string) => {
    setBusquedaCliente(query);
    if (query.length < 2) {
      setClientesEncontrados([]);
      return;
    }
    try {
      const res = await request(`/clientes/buscar?query=${query}`);
      setClientesEncontrados(res);
    } catch (error) {
      console.error('Error buscando cliente', error);
    }
  };

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setClientesEncontrados([]);
    setBusquedaCliente('');
    setModoPago('SALDO');
  };

  const handleCobrar = async () => {
    if (!evento || isSubmitting || carrito.length === 0) return;

    if (modoPago === 'SALDO') {
      if (!clienteSeleccionado) {
        return Swal.fire({
          title: 'Falta Cliente',
          text: 'Busca y selecciona un cliente para debitar saldo.',
          icon: 'warning'
        });
      }
      if (clienteSeleccionado.saldo < total) {
        return Swal.fire({
          title: 'Saldo Insuficiente',
          text: `Saldo disponible: Q${clienteSeleccionado.saldo.toFixed(2)}`,
          icon: 'error'
        });
      }
    }

    try {
      setIsSubmitting(true);

      const payload = {
        eventoId: evento.id,
        clienteId: modoPago === 'SALDO' ? clienteSeleccionado?.id : null,
        nombreTemporal: modoPago === 'EFECTIVO' ? (nombreTemporal || 'Cliente General') : null,
        productos: carrito.map(item => ({
          productoId: item.id,
          cantidad: item.cantidad
        }))
      };

      await request('/ordenes', {
        method: 'POST',
        body: payload
      });

      Swal.fire({
        icon: 'success',
        title: `¡Cobrado Q${total.toFixed(2)}!`,
        text: modoPago === 'SALDO' ? `Nuevo saldo: Q${(clienteSeleccionado!.saldo - total).toFixed(2)}` : 'Pago registrado exitosamente',
        timer: 1800,
        showConfirmButton: false
      });

      const respMenu = await request(`/productos/menu?eventoId=${evento.id}`);
      setProductos(respMenu);

      if (clienteSeleccionado) {
        setClienteSeleccionado(prev =>
          prev ? { ...prev, saldo: prev.saldo - total } : null
        );
      }

      setCarrito([]);
      setNombreTemporal('');
    } catch (error: any) {
      console.error('Error al cobrar:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo registrar la venta.',
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold animate-pulse">
          Cargando terminal de cobro...
        </div>
      </MainLayout>
    );
  }

  if (!evento) {
    return (
      <MainLayout>
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <Store size={48} className="text-slate-300 mb-3" />
          <h2 className="text-xl font-bold text-slate-700">No hay evento activo</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Para iniciar las ventas del día, el administrador debe crear o activar un evento dominical.
          </p>
        </div>
      </MainLayout>
    );
  }

  const productosFiltrados = productos
    .filter(p => (tabActiva === 'TODOS' ? true : p.categoria === tabActiva))
    .filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()));

  return (
    <MainLayout>
      <div className="flex h-full overflow-hidden">
        {/* ÁREA CENTRAL: CATÁLOGO DE PRODUCTOS */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden min-w-0">
          {/* Header del Catálogo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight">Punto de Venta</h2>
              <p className="text-xs text-slate-400 mt-0.5">Selecciona los productos y agrégalos a la venta</p>
            </div>

            {/* Selector de Píldoras/Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-sm">
              <button
                onClick={() => setTabActiva('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  tabActiva === 'TODOS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setTabActiva('TIENDA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  tabActiva === 'TIENDA' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store size={14} /> Tienda
              </button>
              <button
                onClick={() => setTabActiva('COCINA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  tabActiva === 'COCINA' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ChefHat size={14} /> Cocina
              </button>
            </div>
          </div>

          {/* Buscador de Producto local */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="Filtrar por nombre..."
              value={busquedaProducto}
              onChange={(e) => setBusquedaProducto(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Cuadrícula de Productos con Clic en toda la Tarjeta */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
              {productosFiltrados.map((prod) => {
                const sinStock = prod.stock !== null && prod.stock !== undefined && prod.stock <= 0;
                
                return (
                  <div
                    key={prod.id}
                    onClick={() => !sinStock && agregarProducto(prod)}
                    role="button"
                    tabIndex={0}
                    className={`bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all select-none ${
                      sinStock 
                        ? 'border-slate-200 opacity-60 bg-slate-50/50 cursor-not-allowed' 
                        : 'border-slate-200/80 hover:border-blue-400 hover:shadow-md cursor-pointer active:scale-95'
                    }`}
                  >
                    <div>
                      {/* Contenedor del Icono y Badge de Stock */}
                      <div className="h-28 rounded-xl bg-slate-50 flex items-center justify-center mb-3 text-slate-400 relative pointer-events-none">
                        {prod.categoria === 'COCINA' ? (
                          <ChefHat size={36} className="text-orange-400" />
                        ) : (
                          <Store size={36} className="text-blue-500" />
                        )}
                        {prod.stock !== null && prod.stock !== undefined && (
                          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prod.stock <= 3 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200/60 text-slate-600'
                          }`}>
                            {prod.stock} disp.
                          </span>
                        )}
                      </div>
                      
                      {/* Nombre del Producto */}
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-2 leading-tight pointer-events-none">
                        {prod.nombre}
                      </h4>
                    </div>

                    {/* Pie de tarjeta con Precio y Botón Visual */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-50 pointer-events-none">
                      <span className="font-black text-slate-900 text-sm">
                        Q{prod.precio.toFixed(2)}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition shadow-sm ${
                          sinStock 
                            ? 'bg-slate-200 text-slate-400' 
                            : 'bg-blue-600 text-white shadow-blue-500/30'
                        }`}
                      >
                        <Plus size={15} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: TICKET DE COBRO */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Orden de Venta</h3>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">
                {evento.nombre}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
              En proceso
            </span>
          </div>

          {/* Lista de Ítems en Carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                <Store size={40} className="mb-2 opacity-40" />
                <p className="text-xs font-semibold">El carrito está vacío</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Agrega productos desde el catálogo</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.nombre}</p>
                    <p className="text-[10px] text-slate-400">Q{item.precio.toFixed(2)} c/u</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => modificarCantidad(item.id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-slate-800">{item.cantidad}</span>
                    <button
                      onClick={() => modificarCantidad(item.id, 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-slate-800">Q{(item.cantidad * item.precio).toFixed(2)}</p>
                    <button
                      onClick={() => eliminarItem(item.id)}
                      className="text-slate-300 hover:text-red-500 transition mt-0.5"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desglose, Método de Pago y Botón Blindado */}
          <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Q{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-base text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>Q{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Selección de Cliente / Billetera */}
            <div className="relative pt-1">
              {clienteSeleccionado ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck size={16} className="text-blue-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-blue-950 truncate">{clienteSeleccionado.nombre}</p>
                      <p className="text-[10px] text-blue-600 font-semibold">Saldo: Q{clienteSeleccionado.saldo.toFixed(2)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setClienteSeleccionado(null); setModoPago('EFECTIVO'); }}
                    className="text-blue-400 hover:text-red-500 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar hermano para cobrar con saldo..."
                    value={busquedaCliente}
                    onChange={(e) => buscarCliente(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  {clientesEncontrados.length > 0 && (
                    <div className="absolute bottom-full mb-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 divide-y divide-slate-50">
                      {clientesEncontrados.map(c => (
                        <div
                          key={c.id}
                          onClick={() => seleccionarCliente(c)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <span className="font-bold text-slate-700">{c.nombre}</span>
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Q{c.saldo.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nombre temporal si es en efectivo */}
            {modoPago === 'EFECTIVO' && !clienteSeleccionado && (
              <input
                type="text"
                placeholder="Nombre del cliente (Opcional)"
                value={nombreTemporal}
                onChange={(e) => setNombreTemporal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            )}

            {/* Píldoras de Método de Pago */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setModoPago('EFECTIVO')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  modoPago === 'EFECTIVO'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Banknote size={14} /> Efectivo
              </button>
              <button
                onClick={() => {
                  if (!clienteSeleccionado) {
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'info',
                      title: 'Busca un cliente primero',
                      showConfirmButton: false,
                      timer: 1500
                    });
                  } else {
                    setModoPago('SALDO');
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  modoPago === 'SALDO'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <CreditCard size={14} /> Billetera
              </button>
            </div>

            {/* BOTÓN COBRAR CON BLOQUEO ANTI-DUPLICIDAD */}
            <button
              onClick={handleCobrar}
              disabled={carrito.length === 0 || isSubmitting}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                carrito.length === 0 || isSubmitting
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando venta...</span>
                </>
              ) : (
                <span>Cobrar Q{total.toFixed(2)}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}