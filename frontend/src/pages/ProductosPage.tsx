import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { 
  Package, 
  Store, 
  ChefHat, 
  Pencil, 
  Trash2, 
  Plus, 
  Calendar, 
  CalendarPlus,
  AlertCircle, 
  Search,
  Flag,
  X
} from 'lucide-react';

interface Evento {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: 'COCINA' | 'TIENDA';
  stock?: number | null;
  fechaVencimiento?: string | null;
  evento?: { id: number; nombre?: string } | null;
}

export default function ProductosPage() {
  const { request } = useAuth();

  // Estados de datos
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedVista, setSelectedVista] = useState<string>('GLOBAL');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados de modal de eventos
  const [modalEventoAbierto, setModalEventoAbierto] = useState(false);
  const [nuevoEventoNombre, setNuevoEventoNombre] = useState('');

  // Estados del formulario de creación de productos
  const [categoriaProd, setCategoriaProd] = useState<'COCINA' | 'TIENDA'>('TIENDA');
  const [nombreProd, setNombreProd] = useState('');
  const [precioProd, setPrecioProd] = useState('');
  const [stockProd, setStockProd] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  useEffect(() => {
    cargarEventos();
    cargarInventarioGlobal();
  }, []);

  // Carga todos los eventos para gestión
  const cargarEventos = async () => {
    try {
      const res: Evento[] = await request('/eventos');
      setEventos(res);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const cargarInventarioGlobal = async () => {
    try {
      setLoading(true);
      const res = await request('/productos/globales');
      setProductos(res);
      setSelectedVista('GLOBAL');
    } catch (error) {
      console.error('Error cargando catálogo global:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMenuEvento = async (eventoId: string) => {
    if (eventoId === 'GLOBAL') {
      cargarInventarioGlobal();
      return;
    }
    try {
      setLoading(true);
      const res = await request(`/productos/menu?eventoId=${eventoId}`);
      setProductos(res);
      setSelectedVista(eventoId);
    } catch (error) {
      console.error('Error cargando menú del evento:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACCIONES DE EVENTOS ---
  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEventoNombre.trim()) return;

    try {
      const nuevo = await request('/eventos', {
        method: 'POST',
        body: { nombre: nuevoEventoNombre.trim(), activo: true }
      });

      Swal.fire({
        icon: 'success',
        title: 'Evento Creado',
        text: `El evento "${nuevoEventoNombre}" está activo para ventas.`,
        timer: 1500,
        showConfirmButton: false
      });

      setNuevoEventoNombre('');
      await cargarEventos();
      // Si el backend devuelve el objeto creado, lo seleccionamos directamente
      if (nuevo?.id) {
        cargarMenuEvento(nuevo.id.toString());
      }
      setModalEventoAbierto(false);
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No se pudo crear el evento', 'error');
    }
  };

  const handleCerrarEvento = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Finalizar Evento?',
      text: 'Una vez cerrado, no se podrán realizar más ventas ni agregar productos de cocina.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Sí, cerrar evento',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await request(`/eventos/${id}/cerrar`, { method: 'PATCH' });
        Swal.fire('Evento Finalizado', 'El evento ha sido cerrado.', 'info');
        await cargarEventos();
        cargarInventarioGlobal();
      } catch (err: any) {
        Swal.fire('Error', err.message || 'No se pudo cerrar el evento.', 'error');
      }
    }
  };

  // --- ACCIONES DE PRODUCTOS ---
  const crearProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (categoriaProd === 'COCINA' && selectedVista === 'GLOBAL') {
      return Swal.fire({
        title: 'Evento no seleccionado',
        text: 'Los productos de cocina requieren asociarse a un evento activo. Selecciónalo arriba o crea uno nuevo.',
        icon: 'warning'
      });
    }

    const payload = {
      nombre: nombreProd.trim(),
      precio: parseFloat(precioProd),
      categoria: categoriaProd,
      stock: stockProd ? parseInt(stockProd) : null,
      fechaVencimiento: fechaVencimiento || null,
      evento: (categoriaProd === 'COCINA' && selectedVista !== 'GLOBAL')
        ? { id: parseInt(selectedVista) }
        : null
    };

    try {
      await request('/productos', {
        method: 'POST',
        body: payload
      });

      Swal.fire({
        icon: 'success',
        title: 'Producto Registrado',
        timer: 1400,
        showConfirmButton: false
      });

      setNombreProd('');
      setPrecioProd('');
      setStockProd('');
      setFechaVencimiento('');

      if (selectedVista === 'GLOBAL') {
        cargarInventarioGlobal();
      } else {
        cargarMenuEvento(selectedVista);
      }
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No se pudo registrar el producto', 'error');
    }
  };

  const editarProducto = async (producto: Producto) => {
    const { value: formValues } = await Swal.fire({
      title: '✏️ Editar Producto',
      html: `
        <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 13px;">
          <label style="font-weight: bold; color: #475569;">NOMBRE:</label>
          <input id="swal-nombre" class="swal2-input" style="margin: 0; width: 100%;" value="${producto.nombre}">
          
          <label style="font-weight: bold; color: #475569; margin-top: 4px;">PRECIO (Q):</label>
          <input id="swal-precio" type="number" step="0.01" class="swal2-input" style="margin: 0; width: 100%;" value="${producto.precio}">
          
          <label style="font-weight: bold; color: #475569; margin-top: 4px;">STOCK (Vacío = ilimitado):</label>
          <input id="swal-stock" type="number" class="swal2-input" style="margin: 0; width: 100%;" value="${producto.stock ?? ''}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      preConfirm: () => {
        const nombreInput = (document.getElementById('swal-nombre') as HTMLInputElement).value;
        const precioInput = (document.getElementById('swal-precio') as HTMLInputElement).value;
        const stockInput = (document.getElementById('swal-stock') as HTMLInputElement).value;

        if (!nombreInput.trim() || !precioInput) {
          Swal.showValidationMessage('Nombre y precio son obligatorios');
          return false;
        }

        return {
          ...producto,
          nombre: nombreInput.trim(),
          precio: parseFloat(precioInput),
          stock: stockInput !== '' ? parseInt(stockInput) : null
        };
      }
    });

    if (formValues) {
      try {
        await request(`/productos/${producto.id}`, {
          method: 'PUT',
          body: formValues
        });

        Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 1200, showConfirmButton: false });

        if (selectedVista === 'GLOBAL') {
          cargarInventarioGlobal();
        } else {
          cargarMenuEvento(selectedVista);
        }
      } catch (error: any) {
        Swal.fire('Error', error.message || 'No se pudo actualizar', 'error');
      }
    }
  };

  const eliminarProducto = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Solo se podrá borrar si no cuenta con ventas registradas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await request(`/productos/${id}`, { method: 'DELETE' });
        Swal.fire('Eliminado', 'Producto retirado', 'success');

        if (selectedVista === 'GLOBAL') {
          cargarInventarioGlobal();
        } else {
          cargarMenuEvento(selectedVista);
        }
      } catch (err: any) {
        Swal.fire('Error', err.message || 'No se puede eliminar un producto con ventas.', 'error');
      }
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const eventosActivos = eventos.filter(ev => ev.activo);

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera Principal, Gestión de Eventos y Filtro de Ámbito */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight">Productos e Inventario</h2>
              <p className="text-xs text-slate-400">Catálogo general de tienda y menús de eventos para cocina</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón para Abrir Modal de Eventos */}
            <button
              onClick={() => setModalEventoAbierto(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition active:scale-95"
            >
              <CalendarPlus size={15} />
              <span>Gestionar Eventos</span>
            </button>

            {/* Selector de Ámbito (Tienda Global vs Evento) */}
            <select
              value={selectedVista}
              onChange={(e) => {
                const val = e.target.value;
                cargarMenuEvento(val);
                if (val !== 'GLOBAL') {
                  setCategoriaProd('COCINA');
                }
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="GLOBAL">🌍 Inventario Global (Tienda)</option>
              {eventosActivos.map((ev) => (
                <option key={ev.id} value={ev.id.toString()}>
                  🟢 Evento: {ev.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Formulario de Creación Rápida de Producto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" /> Registrar Nuevo Ítem
            </h3>
            {categoriaProd === 'COCINA' && selectedVista === 'GLOBAL' && (
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <AlertCircle size={13} /> Selecciona un evento arriba para guardar en cocina
              </span>
            )}
          </div>

          <form onSubmit={crearProducto} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Categoría
                </label>
                <select
                  value={categoriaProd}
                  onChange={(e) => setCategoriaProd(e.target.value as 'COCINA' | 'TIENDA')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="TIENDA">🛒 Tienda (Global)</option>
                  <option value="COCINA">🍽️ Cocina (Evento)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Tamal, Chuchito, Bebida..."
                  value={nombreProd}
                  onChange={(e) => setNombreProd(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Precio (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precioProd}
                  onChange={(e) => setPrecioProd(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  placeholder="Vacío = Ilimitado"
                  value={stockProd}
                  onChange={(e) => setStockProd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-[0.99]"
                >
                  Guardar Producto
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tabla de Productos Existentes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en el catálogo actual..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {productosFiltrados.length} productos mostrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Ámbito / Tipo</th>
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Precio</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productosFiltrados.map((p) => {
                  const esTienda = p.categoria === 'TIENDA';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        {esTienda ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                            <Store size={12} /> TIENDA (Global)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/70">
                            <ChefHat size={12} /> COCINA (Evento)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {p.nombre}
                      </td>

                      <td className="px-5 py-3.5 font-black text-slate-900">
                        Q{p.precio.toFixed(2)}
                      </td>

                      <td className="px-5 py-3.5">
                        {p.stock !== null && p.stock !== undefined ? (
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                            p.stock <= 3 
                              ? 'bg-red-50 text-red-600 border border-red-200' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.stock} unidades
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold italic">Ilimitado (∞)</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => editarProducto(p)}
                            title="Editar"
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => eliminarProducto(p.id)}
                            title="Eliminar"
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {productosFiltrados.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No se encontraron productos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PARA CREAR Y CERRAR EVENTOS */}
        {modalEventoAbierto && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Gestión de Eventos</h4>
                </div>
                <button
                  onClick={() => setModalEventoAbierto(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulario para Nuevo Evento */}
              <form onSubmit={handleCrearEvento} className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Nombre del Nuevo Evento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Kermesse Pro-Templo, Venta Especial..."
                    value={nuevoEventoNombre}
                    onChange={(e) => setNuevoEventoNombre(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Crear
                  </button>
                </div>
              </form>

              {/* Lista de Eventos Existentes con Estado y Cierre */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Eventos Registrados
                </p>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-50">
                  {eventos.map((ev) => (
                    <div key={ev.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{ev.nombre}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          ev.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {ev.activo ? '🟢 Activo' : '🔴 Cerrado'}
                        </span>
                      </div>

                      {ev.activo && (
                        <button
                          onClick={() => handleCerrarEvento(ev.id)}
                          title="Cerrar evento para ventas"
                          className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 text-[10px] font-bold transition"
                        >
                          <Flag size={12} />
                          <span>Finalizar</span>
                        </button>
                      )}
                    </div>
                  ))}

                  {eventos.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No hay eventos registrados.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}