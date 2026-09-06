import { useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext';
import { api } from '../config/api';
import { MainLayout } from '../components/MainLayout';
import { 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  UtensilsCrossed 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface Evento {
  id: number;
  nombre: string;
  activo: boolean;
}

interface DetalleOrden {
  id: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    categoria: 'COCINA' | 'TIENDA';
  };
  cantidad: number;
}

interface Orden {
  id: number;
  fecha: string;
  total: number;
  estado: string;
  evento?: { id: number; nombre: string } | null;
  detalles: DetalleOrden[];
}

const COLORES_DONUT = ['#2563eb', '#f97316'];

export default function ReportesPage() {
  const { request, user } = useAuth();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null);
  const [eventoParaExportar, setEventoParaExportar] = useState<string>('');
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const resEventos: Evento[] = await request('/eventos');
      setEventos(resEventos);

      let idSeleccionado = '';
      try {
        const resActivo: Evento = await request('/eventos/activo');
        if (resActivo && resActivo.id) {
          setEventoActivo(resActivo);
          idSeleccionado = resActivo.id.toString();
        }
      } catch {
        if (resEventos.length > 0) {
          idSeleccionado = resEventos[0].id.toString();
        }
      }

      setEventoParaExportar(idSeleccionado);

      if (idSeleccionado) {
        try {
          const resOrdenes: Orden[] = await request(`/ordenes?eventoId=${idSeleccionado}`);
          setOrdenes(resOrdenes);
        } catch {
          setOrdenes([]);
        }
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambioEvento = async (nuevoId: string) => {
    setEventoParaExportar(nuevoId);
    if (!nuevoId) return;

    try {
      const resOrdenes: Orden[] = await request(`/ordenes?eventoId=${nuevoId}`);
      setOrdenes(resOrdenes);
    } catch (error) {
      console.error('Error al cambiar de evento:', error);
    }
  };

  const descargarReporteExcel = async () => {
    if (!eventoParaExportar) {
      return Swal.fire('Atención', 'Selecciona un evento para exportar', 'warning');
    }

    const ev = eventos.find(e => e.id.toString() === eventoParaExportar);
    const nombreEvento = ev ? ev.nombre : 'Evento';

    try {
      Swal.fire({
        title: 'Generando Reporte...',
        text: 'Descargando archivo Excel...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await api.get(`/ordenes/exportar?eventoId=${eventoParaExportar}`, {
        headers: { 'Authorization': user?.authHeader },
        responseType: 'blob'
      });

      const urlTemporal = window.URL.createObjectURL(new Blob([response.data]));
      const enlace = document.createElement('a');
      enlace.href = urlTemporal;
      enlace.setAttribute('download', `Reporte_${nombreEvento.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(urlTemporal);

      Swal.close();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo generar el archivo Excel.', 'error');
    }
  };

  const datosProductos = useMemo(() => {
    const mapa: Record<string, { nombre: string; tienda: number; cocina: number }> = {};

    ordenes.forEach(o => {
      o.detalles.forEach(d => {
        const prod = d.producto;
        const nombreLimpio = prod.nombre.replace(/^\[.*?\]\s*/, '');
        if (!mapa[nombreLimpio]) {
          mapa[nombreLimpio] = { nombre: nombreLimpio, tienda: 0, cocina: 0 };
        }
        if (prod.categoria === 'TIENDA') {
          mapa[nombreLimpio].tienda += d.cantidad;
        } else if (prod.categoria === 'COCINA' && (!eventoActivo || o.evento?.id === eventoActivo.id)) {
          mapa[nombreLimpio].cocina += d.cantidad;
        }
      });
    });

    return Object.values(mapa)
      .sort((a, b) => (b.tienda + b.cocina) - (a.tienda + a.cocina))
      .slice(0, 8);
  }, [ordenes, eventoActivo]);

  const datosSemanales = useMemo(() => {
    const semanas = [
      { grupo: 'Semana 1', tienda: 0, cocina: 0 },
      { grupo: 'Semana 2', tienda: 0, cocina: 0 },
      { grupo: 'Semana 3', tienda: 0, cocina: 0 },
      { grupo: 'Semana 4', tienda: 0, cocina: 0 }
    ];

    ordenes.forEach(o => {
      const fecha = new Date(o.fecha);
      const dia = fecha.getDate();
      let indexSemana = 0;

      if (dia <= 7) indexSemana = 0;
      else if (dia <= 14) indexSemana = 1;
      else if (dia <= 21) indexSemana = 2;
      else indexSemana = 3;

      o.detalles.forEach(d => {
        const subtotal = d.producto.precio * d.cantidad;
        if (d.producto.categoria === 'TIENDA') {
          semanas[indexSemana].tienda += subtotal;
        } else if (d.producto.categoria === 'COCINA') {
          semanas[indexSemana].cocina += subtotal;
        }
      });
    });

    return semanas;
  }, [ordenes]);

  const { totalTienda, totalCocina, datosDonut } = useMemo(() => {
    let tTienda = 0;
    let tCocina = 0;

    ordenes.forEach(o => {
      o.detalles.forEach(d => {
        const subtotal = d.producto.precio * d.cantidad;
        if (d.producto.categoria === 'TIENDA') tTienda += subtotal;
        if (d.producto.categoria === 'COCINA' && (!eventoActivo || o.evento?.id === eventoActivo.id)) {
          tCocina += subtotal;
        }
      });
    });

    const donut = [
      { name: 'Tienda', valor: tTienda },
      { name: 'Cocina', valor: tCocina }
    ].filter(item => item.valor > 0);

    return { totalTienda: tTienda, totalCocina: tCocina, datosDonut: donut };
  }, [ordenes, eventoActivo]);

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* BARRA SUPERIOR: DESCARGA DE EXCEL (Tema Claro) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight">Dashboard de Analíticas y Reportes</h2>
              <p className="text-xs text-slate-400">Estadísticas comparativas de venta y exportación a Excel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={eventoParaExportar}
              onChange={(e) => handleCambioEvento(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id.toString()}>
                  {ev.activo ? '🟢 Activo: ' : '🔴 '} {ev.nombre}
                </option>
              ))}
            </select>

            <button
              onClick={descargarReporteExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Download size={15} />
              <span>Descargar Excel</span>
            </button>
          </div>
        </div>

        {/* TARJETAS RESUMEN DE VENTAS (Tema Claro) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Ventas Tienda (Global)</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ShoppingBag size={18} />
              </div>
            </div>
            <p className="text-3xl font-black mt-2 text-slate-800">Q{totalTienda.toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Acumulado permanente del catálogo</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Ventas Cocina {eventoActivo ? `(${eventoActivo.nombre})` : ''}</span>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <UtensilsCrossed size={18} />
              </div>
            </div>
            {eventoActivo ? (
              <>
                <p className="text-3xl font-black mt-2 text-orange-600">Q{totalCocina.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Total despachado en este evento</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-400 mt-3 italic">Sin evento dominical activo</p>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Gran Total</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-3xl font-black mt-2 text-emerald-600">Q{(totalTienda + totalCocina).toFixed(2)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Ingresos brutos combinados</p>
          </div>
        </div>

        {/* FILA 1 DE GRÁFICAS: BARRAS Y DONUT (Tema Claro) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRÁFICA DE BARRAS: TIENDA VS COCINA */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-slate-800">Unidades Vendidas por Producto</h3>
              <p className="text-xs text-slate-400">Comparativa de demanda entre artículos de tienda y cocina</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosProductos} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="nombre" 
                    stroke="#64748b" 
                    fontSize={11} 
                    interval={0} 
                    angle={-20} 
                    textAnchor="end" 
                  />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="tienda" name="Tienda" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cocina" name="Cocina" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICA CIRCULAR: DISTRIBUCIÓN DE INGRESOS */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Proporción de Ingresos</h3>
              <p className="text-xs text-slate-400">Porcentaje de ventas generadas</p>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosDonut}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="valor"
                  >
                    {datosDonut.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_DONUT[index % COLORES_DONUT.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`Q${Number(value).toFixed(2)}`, 'Monto']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span className="text-slate-600">Tienda</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                <span className="text-slate-600">Cocina</span>
              </div>
            </div>
          </div>

        </div>

        {/* FILA 2 DE GRÁFICAS: ÁREA TEMPORAL POR SEMANA (Tema Claro) */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Ingresos Semanales (Mes en Curso)</h3>
              <p className="text-xs text-slate-400">Total en Quetzales (Q) recaudados por bloque semanal</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar size={14} className="text-slate-400" />
              <span className="font-semibold">Por Semanas</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosSemanales} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTiendaClaro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCocinaClaro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="grupo" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Q${val}`} />
                <Tooltip 
                  formatter={(val: any) => [`Q${Number(val).toFixed(2)}`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend />
                <Area type="monotone" dataKey="tienda" name="Ventas Tienda (Q)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTiendaClaro)" />
                <Area type="monotone" dataKey="cocina" name="Ventas Cocina (Q)" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCocinaClaro)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}