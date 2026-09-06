import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Pencil, 
  Trash2, 
  Cookie, 
  Wine, 
  Candy, 
  Sparkles, 
  Layers,
  ScanBarcode,
  Camera,
  X
} from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: 'COCINA' | 'TIENDA';
  stock?: number | null;
  fechaVencimiento?: string | null;
}

type SubcategoriaTienda = 'TODAS' | 'BEBIDAS' | 'GOLOSINAS' | 'GALLETAS' | 'DULCES' | 'VARIOS';

export default function InventarioPage() {
  const { request } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState<SubcategoriaTienda>('TODAS');
  const [loading, setLoading] = useState(false);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<Exclude<SubcategoriaTienda, 'TODAS'>>('GOLOSINAS');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  // Modal de escáner simulado
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  useEffect(() => {
    cargarInventarioTienda();
  }, []);

  const cargarInventarioTienda = async () => {
    try {
      setLoading(true);
      const res: Producto[] = await request('/productos/globales');
      setProductos(res.filter(p => p.categoria === 'TIENDA'));
    } catch (error) {
      console.error('Error cargando inventario de tienda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper para clasificar según tag o palabra clave
  const obtenerSubcategoria = (nombreCompleto: string): Exclude<SubcategoriaTienda, 'TODAS'> => {
    const n = nombreCompleto.toUpperCase();
    if (n.startsWith('[BEBIDAS]') || n.includes('COCA') || n.includes('SODA') || n.includes('JUGO') || n.includes('AGUA') || n.includes('LATA')) return 'BEBIDAS';
    if (n.startsWith('[GOLOSINAS]') || n.includes('TORTRIX') || n.includes('LAYS') || n.includes('PAPAS') || n.includes('DORITOS') || n.includes('CHIPS')) return 'GOLOSINAS';
    if (n.startsWith('[GALLETAS]') || n.includes('OREO') || n.includes('GAMA') || n.includes('CLUB')) return 'GALLETAS';
    if (n.startsWith('[DULCES]') || n.includes('CHOCOLATE') || n.includes('BOMBON') || n.includes('CHICLE')) return 'DULCES';
    return 'VARIOS';
  };

  // Helper para mostrar el nombre limpio en la tabla
  const limpiarNombre = (nombreOriginal: string) => {
    return nombreOriginal.replace(/^\[(BEBIDAS|GOLOSINAS|GALLETAS|DULCES|VARIOS)\]\s*/i, '');
  };

  // Evaluación de alertas de caducidad
  const evaluarVencimiento = (fechaStr?: string | null) => {
    if (!fechaStr) return { estado: 'NORMAL', dias: null, texto: 'N/A' };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVenc = new Date(fechaStr);
    fechaVenc.setHours(0, 0, 0, 0);

    const diffTiempo = fechaVenc.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return { estado: 'VENCIDO', dias: diffDias, texto: `Vencido (${Math.abs(diffDias)}d)` };
    }
    if (diffDias <= 15) {
      return { estado: 'PROXIMO', dias: diffDias, texto: `Vence en ${diffDias}d` };
    }
    return { estado: 'BUENO', dias: diffDias, texto: fechaStr };
  };

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !precio) return;

    try {
      // Guardamos la etiqueta en el nombre para compatibilidad total con el backend actual
      const nombreConTag = `[${tipoSeleccionado}] ${nombre.trim()}`;

      const payload = {
        nombre: nombreConTag,
        precio: parseFloat(precio),
        categoria: 'TIENDA',
        stock: stock ? parseInt(stock) : 0,
        fechaVencimiento: fechaVencimiento || null,
        evento: null
      };

      await request('/productos', {
        method: 'POST',
        body: payload
      });

      Swal.fire({
        icon: 'success',
        title: 'Producto Registrado',
        text: `${nombre} clasificado como ${tipoSeleccionado}`,
        timer: 1400,
        showConfirmButton: false
      });

      setNombre('');
      setPrecio('');
      setStock('');
      setFechaVencimiento('');
      cargarInventarioTienda();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'No se pudo registrar el producto', 'error');
    }
  };

  const handleModificarStock = async (producto: Producto) => {
    const subCatActual = obtenerSubcategoria(producto.nombre);
    const nombreLimpio = limpiarNombre(producto.nombre);

    const { value: formValues } = await Swal.fire({
      title: `Editar Producto`,
      html: `
        <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 13px;">
          <label style="font-weight: bold; color: #475569;">Clasificación:</label>
          <select id="swal-tipo" class="swal2-input" style="margin: 0; width: 100%; height: 38px;">
            <option value="BEBIDAS" ${subCatActual === 'BEBIDAS' ? 'selected' : ''}>Bebidas / Gaseosas</option>
            <option value="GOLOSINAS" ${subCatActual === 'GOLOSINAS' ? 'selected' : ''}>Golosinas / Frituras</option>
            <option value="GALLETAS" ${subCatActual === 'GALLETAS' ? 'selected' : ''}>Galletas</option>
            <option value="DULCES" ${subCatActual === 'DULCES' ? 'selected' : ''}>Dulces / Chocolates</option>
            <option value="VARIOS" ${subCatActual === 'VARIOS' ? 'selected' : ''}>Varios</option>
          </select>

          <label style="font-weight: bold; color: #475569; margin-top: 4px;">Nombre del Artículo:</label>
          <input id="swal-nombre" class="swal2-input" style="margin: 0; width: 100%;" value="${nombreLimpio}">

          <label style="font-weight: bold; color: #475569; margin-top: 4px;">Precio Venta (Q):</label>
          <input id="swal-precio" type="number" step="0.01" class="swal2-input" style="margin: 0; width: 100%;" value="${producto.precio}">

          <label style="font-weight: bold; color: #475569; margin-top: 4px;">Stock Actual (Unidades):</label>
          <input id="swal-stock" type="number" class="swal2-input" style="margin: 0; width: 100%;" value="${producto.stock ?? 0}">

          <label style="font-weight: bold; color: #475569; margin-top: 4px;">Fecha de Vencimiento:</label>
          <input id="swal-fecha" type="date" class="swal2-input" style="margin: 0; width: 100%;" value="${producto.fechaVencimiento || ''}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      preConfirm: () => {
        const tipoInput = (document.getElementById('swal-tipo') as HTMLSelectElement).value;
        const nombreInput = (document.getElementById('swal-nombre') as HTMLInputElement).value;
        const precioInput = (document.getElementById('swal-precio') as HTMLInputElement).value;
        const stockInput = (document.getElementById('swal-stock') as HTMLInputElement).value;
        const fechaInput = (document.getElementById('swal-fecha') as HTMLInputElement).value;

        if (!nombreInput.trim() || !precioInput) {
          Swal.showValidationMessage('Nombre y precio son obligatorios');
          return false;
        }

        return {
          ...producto,
          nombre: `[${tipoInput}] ${nombreInput.trim()}`,
          precio: parseFloat(precioInput),
          stock: stockInput !== '' ? parseInt(stockInput) : null,
          fechaVencimiento: fechaInput || null
        };
      }
    });

    if (formValues) {
      try {
        await request(`/productos/${producto.id}`, {
          method: 'PUT',
          body: formValues
        });

        Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1200, showConfirmButton: false });
        cargarInventarioTienda();
      } catch (error: any) {
        Swal.fire('Error', error.message || 'No se pudo actualizar', 'error');
      }
    }
  };

  const handleEliminar = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Solo se borrará si no cuenta con ventas registradas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await request(`/productos/${id}`, { method: 'DELETE' });
        Swal.fire('Eliminado', 'Producto retirado de existencias', 'success');
        cargarInventarioTienda();
      } catch (err: any) {
        Swal.fire('Error', err.message || 'No se pudo eliminar el producto', 'error');
      }
    }
  };

  // Filtrado compuesto
  const productosFiltrados = productos.filter((p) => {
    const sub = obtenerSubcategoria(p.nombre);
    const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (subcategoriaFiltro === 'TODAS') return cumpleBusqueda;
    return cumpleBusqueda && sub === subcategoriaFiltro;
  });

  const totalItems = productos.length;
  const itemsBajoStock = productos.filter(p => p.stock !== null && p.stock !== undefined && p.stock < 5);
  const itemsProximosVencer = productos.filter(p => {
    const v = evaluarVencimiento(p.fechaVencimiento);
    return v.estado === 'VENCIDO' || v.estado === 'PROXIMO';
  });

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera y Botón Escáner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Boxes size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight">Inventario de Tienda</h2>
              <p className="text-xs text-slate-400">Control de existencias, clasificación por tipo y caducidades</p>
            </div>
          </div>

          {/* BOTÓN ESCANEAR PRODUCTO */}
          <button
            onClick={() => setMostrarEscaner(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
          >
            <ScanBarcode size={16} />
            <span>Escanear Producto</span>
          </button>
        </div>

        {/* Tarjetas de Métricas y Alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total en Catálogo</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{totalItems} productos</p>
            </div>
            <Boxes size={28} className="text-blue-500 opacity-70" />
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            itemsBajoStock.length > 0 ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm' : 'bg-white border-slate-200/80 text-slate-700 shadow-sm'
          }`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">Alerta Stock Crítico (&lt; 5)</p>
              <p className="text-2xl font-black mt-0.5">{itemsBajoStock.length} productos</p>
            </div>
            <AlertTriangle size={28} className={itemsBajoStock.length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'} />
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            itemsProximosVencer.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm' : 'bg-white border-slate-200/80 text-slate-700 shadow-sm'
          }`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Alerta de Caducidad (15 días)</p>
              <p className="text-2xl font-black mt-0.5">{itemsProximosVencer.length} artículos</p>
            </div>
            <Clock size={28} className={itemsProximosVencer.length > 0 ? 'text-amber-500' : 'text-slate-300'} />
          </div>
        </div>

        {/* Formulario de Creación con Clasificador de Tipo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Plus size={16} className="text-blue-600" /> Registrar Nuevo Artículo en Tienda
          </h3>

          <form onSubmit={handleCrearProducto} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              
              {/* SELECTOR DE TIPO / CLASIFICACIÓN */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Tipo de Producto
                </label>
                <select
                  value={tipoSeleccionado}
                  onChange={(e) => setTipoSeleccionado(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="BEBIDAS">🥤 Gaseosa / Bebida</option>
                  <option value="GOLOSINAS">🥔 Golosina / Fritura</option>
                  <option value="GALLETAS">🍪 Galleta</option>
                  <option value="DULCES">🍬 Dulce / Chocolate</option>
                  <option value="VARIOS">📦 Varios</option>
                </select>
              </div>

              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre (ej. Doritos queso, Coca-Cola 600ml)
                </label>
                <input
                  type="text"
                  placeholder="Descripción..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Precio (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Existencias (Stock)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Fecha de Vencimiento */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-[0.99]"
              >
                Guardar en Inventario
              </button>
            </div>
          </form>
        </div>

        {/* Píldoras de Filtro y Tabla */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Pestañas de Subcategorías */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSubcategoriaFiltro('TODAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  subcategoriaFiltro === 'TODAS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers size={13} /> Todas ({totalItems})
              </button>
              <button
                onClick={() => setSubcategoriaFiltro('BEBIDAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  subcategoriaFiltro === 'BEBIDAS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Wine size={13} /> Bebidas
              </button>
              <button
                onClick={() => setSubcategoriaFiltro('GOLOSINAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  subcategoriaFiltro === 'GOLOSINAS' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles size={13} /> Golosinas
              </button>
              <button
                onClick={() => setSubcategoriaFiltro('GALLETAS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  subcategoriaFiltro === 'GALLETAS' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Cookie size={13} /> Galletas
              </button>
              <button
                onClick={() => setSubcategoriaFiltro('DULCES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  subcategoriaFiltro === 'DULCES' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Candy size={13} /> Dulces
              </button>
            </div>

            {/* Buscador */}
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tabla de Existencias con Alertas Visuales */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Artículo</th>
                  <th className="px-5 py-3">Precio</th>
                  <th className="px-5 py-3">Stock / Alerta</th>
                  <th className="px-5 py-3">Caducidad</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productosFiltrados.map((prod) => {
                  const subCat = obtenerSubcategoria(prod.nombre);
                  const venc = evaluarVencimiento(prod.fechaVencimiento);
                  const bajoStock = prod.stock !== null && prod.stock !== undefined && prod.stock < 5;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {subCat}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {limpiarNombre(prod.nombre)}
                      </td>

                      <td className="px-5 py-3.5 font-black text-slate-900">
                        Q{prod.precio.toFixed(2)}
                      </td>

                      {/* Control de Stock */}
                      <td className="px-5 py-3.5">
                        {prod.stock !== null && prod.stock !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                              bajoStock 
                                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {prod.stock} un.
                            </span>
                            {bajoStock && (
                              <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                                <AlertTriangle size={12} /> Stock bajo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Ilimitado</span>
                        )}
                      </td>

                      {/* Alerta de Fecha de Vencimiento */}
                      <td className="px-5 py-3.5">
                        {venc.estado === 'VENCIDO' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 rounded-md border border-red-200">
                            <AlertTriangle size={11} /> {venc.texto}
                          </span>
                        )}
                        {venc.estado === 'PROXIMO' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                            <Clock size={11} /> {venc.texto}
                          </span>
                        )}
                        {venc.estado === 'BUENO' && (
                          <span className="text-slate-600 text-xs font-medium">
                            {prod.fechaVencimiento}
                          </span>
                        )}
                        {venc.estado === 'NORMAL' && (
                          <span className="text-slate-400 text-xs italic">N/A</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleModificarStock(prod)}
                            title="Editar clasificación o stock"
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleEliminar(prod.id)}
                            title="Eliminar producto"
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
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No hay artículos registrados bajo este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL SIMULADOR DE ESCÁNER DE CÓDIGO DE BARRAS */}
        {mostrarEscaner && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
              <button
                onClick={() => setMostrarEscaner(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                  <Camera size={24} />
                </div>
                <h4 className="font-black text-slate-800 text-base">Escáner de Código de Barras</h4>
                <p className="text-xs text-slate-400">
                  Apunta la cámara al código de barras del producto para autocompletar existencias.
                </p>

                {/* Área de visor de cámara simulada */}
                <div className="h-44 bg-slate-900 rounded-xl relative flex items-center justify-center overflow-hidden my-3 border border-slate-800">
                  <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
                  <ScanBarcode size={48} className="text-slate-600 opacity-40" />
                  <span className="absolute bottom-2 text-[10px] font-mono text-slate-400">
                    Buscando código...
                  </span>
                </div>

                <button
                  onClick={() => {
                    setMostrarEscaner(false);
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'info',
                      title: 'Módulo de hardware en desarrollo',
                      showConfirmButton: false,
                      timer: 2000
                    });
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cerrar Visor
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}