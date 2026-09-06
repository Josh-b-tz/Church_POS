import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext';
import { 
  ChefHat, 
  Clock, 
  Search, 
  Check, 
  ArrowLeft, 
  ChevronRight, 
  UtensilsCrossed, 
  User 
} from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  categoria?: string;
}

interface DetalleOrden {
  id: number;
  producto: Producto;
  cantidad: number;
}

interface Orden {
  id: number;
  fecha: string;
  total: number;
  estado: string;
  nombreClienteTemporal?: string | null;
  cliente?: { id: number; nombre: string } | null;
  evento?: { id: number; nombre: string } | null;
  detalles: DetalleOrden[];
}

export default function CocinaPage() {
  const { request, logout } = useAuth();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [eventoActivoId, setEventoActivoId] = useState<number | null>(null);
  const [nombreEvento, setNombreEvento] = useState<string>('Sincronizando...');

  // 1. Obtener Evento Activo e Iniciar Sincronización
  useEffect(() => {
    let intervalId: any;

    const inicializar = async () => {
      let idEvento: number | null = null;
      let titulo = 'Sin evento';

      try {
        const ev = await request('/eventos/activo');
        if (ev && ev.id) {
          idEvento = ev.id;
          titulo = ev.nombre;
        }
      } catch {
        // Fallback en caso de no tener activo
      }

      if (!idEvento) {
        try {
          const eventos = await request('/eventos');
          if (Array.isArray(eventos) && eventos.length > 0) {
            idEvento = eventos[0].id;
            titulo = eventos[0].nombre;
          }
        } catch (e) {
          console.error('Error al listar eventos:', e);
        }
      }

      setEventoActivoId(idEvento);
      setNombreEvento(titulo);

      if (idEvento) {
        cargarComandas(idEvento);
        intervalId = setInterval(() => cargarComandas(idEvento!), 2500);
      }
    };

    inicializar();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // 2. Consulta exacta al Backend: ?eventoId=X&estado=PENDIENTE
  const cargarComandas = async (idEvento: number) => {
    try {
      const res: Orden[] = await request(`/ordenes?eventoId=${idEvento}&estado=PENDIENTE`);
      const lista = Array.isArray(res) ? res : [];

      // Filtrar únicamente los pedidos que lleven platillos de cocina
      const soloCocina = lista.filter(o =>
        o.detalles && o.detalles.some(d => d.producto?.categoria === 'COCINA' || !d.producto?.categoria)
      );

      setOrdenes(soloCocina);

      setOrdenSeleccionada(prev => {
        if (!prev) return null;
        return soloCocina.find(o => o.id === prev.id) || null;
      });
    } catch (error) {
      console.error('Error al cargar comandas:', error);
    }
  };

  const formatearHora = (fechaIso: string) => {
    if (!fechaIso) return '--:--';
    const d = new Date(fechaIso);
    return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calcularMinutos = (fechaIso: string) => {
    if (!fechaIso) return 0;
    const creada = new Date(fechaIso).getTime();
    if (isNaN(creada)) return 0;
    const diff = Math.floor((Date.now() - creada) / 60000);
    return diff < 0 ? 0 : diff;
  };

  // 3. Despachar: Llamada exacta al PATCH /{id}/listo de tu OrdenController
  // Despacho con alerta central prominente
  const handleDespachar = async (id: number) => {
    try {
      const ordenADespachar = ordenes.find(o => o.id === id);
      const identificador = ordenADespachar ? obtenerTituloComanda(ordenADespachar) : `#${id}`;

      await request(`/ordenes/${id}/listo`, {
        method: 'PATCH'
      });

      // Alerta modal grande en el centro de la pantalla
      Swal.fire({
        icon: 'success',
        title: '¡Comanda Despachada!',
        html: `
          <div style="font-size: 1.1rem; color: #334155; margin-top: 8px;">
            La orden de <b>${identificador}</b> ha sido despachada y entregada con éxito.
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2563eb',
        timer: 1800,
        timerProgressBar: true,
        backdrop: `
          rgba(15, 23, 42, 0.45)
        `
      });

      // Retirar la orden de la vista de cocina
      setOrdenes(prev => prev.filter(o => o.id !== id));

      if (ordenSeleccionada?.id === id) {
        setOrdenSeleccionada(null);
      }
    } catch (error: any) {
      console.error('Error despachando comanda:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo despachar la comanda',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // Generador de Título: Nombre del cliente o consecutivo #001
  const obtenerTituloComanda = (orden: Orden) => {
    const nombre = orden.cliente?.nombre || orden.nombreClienteTemporal;
    
    if (nombre && nombre.trim() && nombre.trim().toLowerCase() !== 'cliente general') {
      return nombre;
    }

    const ordenesOrdenadas = [...ordenes].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    const indice = ordenesOrdenadas.findIndex(o => o.id === orden.id);
    const numeroConsecutivo = (indice !== -1 ? indice + 1 : 1).toString().padStart(3, '0');
    
    return `Orden #${numeroConsecutivo}`;
  };

  const ordenesFiltradas = ordenes.filter(o => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return true;
    const titulo = obtenerTituloComanda(o).toLowerCase();
    const numMatch = o.id.toString().includes(termino);
    const prodMatch = o.detalles?.some(d => d.producto?.nombre?.toLowerCase().includes(termino));
    return titulo.includes(termino) || numMatch || prodMatch;
  });

  useEffect(() => {
    if (!ordenSeleccionada && ordenesFiltradas.length > 0) {
      setOrdenSeleccionada(ordenesFiltradas[0]);
    }
  }, [ordenesFiltradas.length]);

  return (
    <div className="h-screen w-screen bg-[#f3f6fc] text-slate-700 flex flex-col font-sans overflow-hidden select-none">
      
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-xs">
            <ChefHat size={22} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 leading-tight">Monitor de Cocina</h1>
            <p className="text-[11px] text-slate-400">
              Estación en Vivo &bull; Evento: <b className="text-slate-600">{nombreEvento}</b>
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ticket o platillo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Estado y Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-[11px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cocina Activa</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Cerrar sesión de cocina"
          >
            <ArrowLeft size={14} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* ÁREA DE COMANDAS */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* COLUMNA IZQUIERDA: TARJETAS */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight">Pedidos en Cocina</h2>
              <p className="text-xs text-slate-400 mt-0.5">Comandas pendientes para preparación en tiempo real</p>
            </div>

            <div className="bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 shadow-xs">
              Pendientes: <span className="text-blue-600 font-black">{ordenesFiltradas.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {ordenesFiltradas.map((orden) => {
                const esSeleccionada = ordenSeleccionada?.id === orden.id;
                const minutos = calcularMinutos(orden.fecha);
                const titulo = obtenerTituloComanda(orden);
                const articulosCocina = orden.detalles?.filter(
                  d => d.producto?.categoria === 'COCINA' || !d.producto?.categoria
                );

                return (
                  <div
                    key={orden.id}
                    onClick={() => setOrdenSeleccionada(orden)}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer select-none ${
                      esSeleccionada
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.01]'
                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 shrink-0">
                            <UtensilsCrossed size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-black text-slate-800 leading-tight truncate" title={titulo}>
                              {titulo}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatearHora(orden.fecha)} &bull; Ticket #{orden.id}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          En preparación
                        </span>
                      </div>

                      <div className="space-y-1.5 py-2 border-t border-slate-100">
                        {articulosCocina?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 w-6">{item.cantidad}x</span>
                            <span className="text-slate-600 flex-1 truncate font-medium">{item.producto?.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock size={13} className="text-slate-400" />
                        <span>Espera: <b className="text-slate-700">{minutos} min</b></span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>

            {ordenesFiltradas.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
                <ChefHat size={40} className="text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Sin comandas pendientes</h4>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                  Todas las órdenes de cocina han sido despachadas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: DETALLE Y BOTÓN */}
        <div className="w-88 xl:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col shrink-0 overflow-hidden">
          {ordenSeleccionada ? (
            <>
              <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <UtensilsCrossed size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-slate-800 truncate" title={obtenerTituloComanda(ordenSeleccionada)}>
                      {obtenerTituloComanda(ordenSeleccionada)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formatearHora(ordenSeleccionada.fecha)} &bull; Ticket #{ordenSeleccionada.id}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  En preparación
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Platillos a Preparar
                </p>

                <div className="space-y-3">
                  {ordenSeleccionada.detalles
                    ?.filter(d => d.producto?.categoria === 'COCINA' || !d.producto?.categoria)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center shrink-0">
                            {item.cantidad}x
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.producto?.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Porción estándar</p>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Identificador:</span>
                    <span className="font-bold text-slate-800">
                      {obtenerTituloComanda(ordenSeleccionada)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tiempo transcurrido:</span>
                    <span className="font-bold text-slate-800">
                      {calcularMinutos(ordenSeleccionada.fecha)} minutos
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón compatible con @PatchMapping("/{id}/listo") */}
              <div className="p-5 border-t border-slate-100 space-y-3 bg-white">
                <button
                  onClick={() => handleDespachar(ordenSeleccionada.id)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={16} />
                  <span>Despachar Comanda</span>
                </button>

                <div className="pt-2 flex items-center gap-2.5 text-xs text-slate-400">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                    <User size={13} />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <p className="font-bold text-slate-700">Estación Cocina</p>
                    <p className="text-slate-400">Control de Alimentos</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-300">
              <UtensilsCrossed size={36} className="opacity-40 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Ninguna comanda seleccionada</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Selecciona una orden de la lista para ver su desglose.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}