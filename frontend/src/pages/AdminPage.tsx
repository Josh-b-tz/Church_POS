import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Evento, Cliente, Producto } from '../types';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext'; 
// 1. IMPORTAMOS AXIOS
import { api } from '../config/api'; 

export default function AdminPage() {
    // 2. EXTRAEMOS 'user' PARA TENER EL ENCABEZADO DE SEGURIDAD
    const { request, user } = useAuth();

    // --- ESTADOS DE DATOS ---
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productosMenu, setProductosMenu] = useState<Producto[]>([]);

    // --- ESTADOS DE FORMULARIOS ---
    const [nuevoEvento, setNuevoEvento] = useState("");
    const [selectedEventoId, setSelectedEventoId] = useState<string>(""); 
    const [nombreProd, setNombreProd] = useState("");
    const [precioProd, setPrecioProd] = useState("");
    const [categoriaProd, setCategoriaProd] = useState<"COCINA" | "TIENDA">("COCINA");
    const [stockProd, setStockProd] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");
    const [nombreCliente, setNombreCliente] = useState("");
    const [saldoInicial, setSaldoInicial] = useState("");

    // --- INICIALIZACIÓN ---
    useEffect(() => {
        cargarEventos();
        cargarClientes();
        cargarInventarioGlobal();
    }, []);

    // --- CARGADORES DE DATOS CON 'request' ---
    const cargarEventos = async () => {
        try {
            const res = await request('/eventos');
            setEventos(res);
        } catch (error) { console.error("Error cargando eventos", error); }
    };

    const cargarClientes = async () => {
        try {
            const res = await request('/clientes/buscar?query=');
            setClientes(res);
        } catch (error) { console.error("Error cargando clientes", error); }
    };

    const cargarInventarioGlobal = async () => {
        try {
            const res = await request(`/productos/globales`); 
            setProductosMenu(res);
            setSelectedEventoId("");
        } catch (error) { console.error("Error cargando inventario global", error); }
    };

    const cargarMenuEvento = async (id: string) => {
        if (!id) {
            cargarInventarioGlobal();
            return;
        }
        try {
            const res = await request(`/productos/menu?eventoId=${id}`);
            setProductosMenu(res);
            setSelectedEventoId(id);
        } catch (error) { console.error("Error cargando menú evento", error); }
    };

    // --- LA NUEVA FUNCIÓN PARA DESCARGAR EL EXCEL ---
    const descargarReporteExcel = async (eventoId: number, nombreEvento: string) => {
        try {
            // Mostramos un mensaje de carga para que el usuario espere
            Swal.fire({
                title: 'Generando Reporte...',
                text: 'Descargando el archivo Excel, por favor espera',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Hacemos la petición enviando el Gafete (Authorization) y pidiendo un BLOB
            const response = await api.get(`/ordenes/exportar?eventoId=${eventoId}`, {
                headers: {
                    'Authorization': user?.authHeader 
                },
                responseType: 'blob' 
            });

            // Creamos el archivo físico en la memoria del navegador
            const urlTemporal = window.URL.createObjectURL(new Blob([response.data]));
            const enlaceInvisible = document.createElement('a');
            enlaceInvisible.href = urlTemporal;
            // Limpiamos el nombre del evento para que sea un nombre de archivo válido
            const nombreSeguro = nombreEvento.replace(/\s+/g, '_');
            enlaceInvisible.setAttribute('download', `Reporte_${nombreSeguro}.xlsx`);
            
            // Forzamos el clic para descargar y limpiamos
            document.body.appendChild(enlaceInvisible);
            enlaceInvisible.click();
            enlaceInvisible.remove();
            window.URL.revokeObjectURL(urlTemporal);

            // Cerramos el mensaje de carga
            Swal.close();

        } catch (error) {
            console.error("Error al descargar el Excel:", error);
            Swal.fire('Error', 'No se pudo descargar el reporte. Revisa tu conexión o sesión.', 'error');
        }
    };

    // --- ACCIONES DE EVENTOS ---
    const crearEvento = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await request('/eventos', { 
                method: 'POST', 
                body: { nombre: nuevoEvento, activo: true } 
            });
            Swal.fire('¡Éxito!', 'Evento creado correctamente', 'success');
            setNuevoEvento("");
            cargarEventos();
        } catch (error: any) { 
            Swal.fire('Error', error.message || 'No se pudo crear el evento', 'error'); 
        }
    };

    const handleAccionEvento = async (id: number, accion: 'cerrar' | 'eliminar') => {
        if (accion === 'cerrar') {
             try {
                 await request(`/eventos/${id}/cerrar`, { method: 'PATCH' });
                 cargarEventos();
                 Swal.fire('Evento Cerrado', 'Ya no se pueden hacer ventas.', 'info');
             } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
        } else {
            const confirm = await Swal.fire({ 
                title: '¿Eliminar Evento?', 
                text: 'Solo si NO tiene ventas registradas.', 
                icon: 'warning', 
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar'
            });

            if (confirm.isConfirmed) {
                try {
                    await request(`/eventos/${id}`, { method: 'DELETE' });
                    cargarEventos();
                    Swal.fire('Eliminado', 'El evento ha sido borrado.', 'success');
                } catch (err: any) { 
                    Swal.fire('Error', err.message || 'No se puede eliminar.', 'error'); 
                }
            }
        }
    };

    // --- ACCIONES DE PRODUCTOS ---
    const crearProducto = async (e: React.FormEvent) => {
        e.preventDefault();

        if (categoriaProd === 'COCINA' && !selectedEventoId) {
            return Swal.fire('Falta información', 'Los productos de COCINA deben pertenecer a un evento.', 'warning');
        }

        const eventoData = (categoriaProd === 'COCINA' && selectedEventoId) 
            ? { id: parseInt(selectedEventoId) } 
            : null; 

        try {
            await request('/productos', {
                method: 'POST',
                body: {
                    nombre: nombreProd,
                    precio: parseFloat(precioProd),
                    categoria: categoriaProd,
                    stock: stockProd ? parseInt(stockProd) : null,
                    fechaVencimiento: fechaVencimiento || null,
                    evento: eventoData
                }
            });

            Swal.fire({
                icon: 'success',
                title: 'Producto Guardado',
                timer: 1500,
                showConfirmButton: false
            });
            
            setNombreProd("");
            setPrecioProd("");
            setStockProd("");
            setFechaVencimiento("");

            if (selectedEventoId) cargarMenuEvento(selectedEventoId);
            else cargarInventarioGlobal();

        } catch (error: any) { 
            Swal.fire('Error', error.message || 'No se pudo guardar el producto', 'error'); 
        }
    };

    const editarProducto = async (producto: Producto) => {
        // 1. Lanzamos una ventana emergente con inputs HTML para editar
        // Nota: Usamos backticks para que lea las variables ${producto.X}
        const { value: formValues } = await Swal.fire({
            title: '✏️ Editar Producto',
            html: `
                <div class="flex flex-col gap-3 text-left px-4">
                    <label class="text-xs font-bold text-gray-500 uppercase">Nombre:</label>
                    <input id="swal-nombre" class="swal2-input !m-0 !w-full" value="${producto.nombre}">
                    
                    <label class="text-xs font-bold text-gray-500 uppercase mt-2">Precio (Q):</label>
                    <input id="swal-precio" type="number" step="0.01" class="swal2-input !m-0 !w-full" value="${producto.precio}">
                    
                    <label class="text-xs font-bold text-gray-500 uppercase mt-2">Stock (Vacío para ilimitado):</label>
                    <input id="swal-stock" type="number" class="swal2-input !m-0 !w-full" value="${producto.stock !== null ? producto.stock : ''}">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '💾 Guardar Cambios',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const nombreInput = document.getElementById('swal-nombre') as HTMLInputElement;
                const precioInput = document.getElementById('swal-precio') as HTMLInputElement;
                const stockInput = document.getElementById('swal-stock') as HTMLInputElement;
                
                const nombre = nombreInput ? nombreInput.value : '';
                const precio = precioInput ? precioInput.value : '';
                const stock = stockInput ? stockInput.value : '';
                
                if (!nombre || !precio) {
                    Swal.showValidationMessage('El nombre y el precio son obligatorios');
                    return false;
                }
                
                return {
                    ...producto,
                    nombre: nombre,
                    precio: parseFloat(precio),
                    stock: stock ? parseInt(stock) : null
                };
            }
        });

        // 4. Si el usuario le dio a guardar, enviamos la petición PUT
        if (formValues) {
            try {
                // AQUÍ USAMOS LOS BACKTICKS Y EL ${} CORRECTAMENTE
                await request(`/productos/${producto.id}`, {
                    method: 'PUT',
                    body: formValues
                });
                
                Swal.fire({ icon: 'success', title: '¡Actualizado!', timer: 1500, showConfirmButton: false });
                
                if (selectedEventoId) cargarMenuEvento(selectedEventoId);
                else cargarInventarioGlobal();
                
            } catch (error: any) {
                Swal.fire('Error', error.message || 'No se pudo actualizar', 'error');
            }
        }
    };

    const eliminarProducto = async (id: number) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar producto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, borrar'
        });

        if (confirm.isConfirmed) {
            try {
                await request(`/productos/${id}`, { method: 'DELETE' });
                if (selectedEventoId) cargarMenuEvento(selectedEventoId);
                else cargarInventarioGlobal();
                Swal.fire('Borrado', '', 'success');
            } catch (err: any) { 
                Swal.fire('Error', err.message || 'No se puede borrar.', 'error'); 
            }
        }
    };

    // --- ACCIONES DE CLIENTES ---
    const crearCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        try { 
            await request('/clientes', { 
                method: 'POST', 
                body: { nombre: nombreCliente, saldo: parseFloat(saldoInicial) } 
            }); 
            cargarClientes(); 
            setNombreCliente(""); 
            setSaldoInicial(""); 
            Swal.fire('Registrado', 'Cliente agregado correctamente', 'success');
        } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
    };

    const eliminarCliente = async (c: Cliente) => {
         if(c.saldo > 0) return Swal.fire('Saldo Pendiente', `El cliente tiene Q${c.saldo}.`, 'warning');
         
         const confirm = await Swal.fire({ title: `¿Borrar a ${c.nombre}?`, icon: 'warning', showCancelButton: true });

         if(confirm.isConfirmed) { 
             try {
                await request(`/clientes/${c.id}`, { method: 'DELETE' }); 
                cargarClientes();
                Swal.fire('Eliminado', '', 'success');
             } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
         }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold mb-6 inline-flex items-center transition">
                <span className="mr-2">←</span> Volver al Menú Principal
            </Link>
            
            <h1 className="text-4xl font-extrabold text-slate-800 mb-8 border-b pb-4">Panel de Administración</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
            {/* === 1. GESTIÓN DE EVENTOS === */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-purple-700 flex items-center gap-2">
                        📅 Gestión de Eventos
                    </h2>
                    
                    <form onSubmit={crearEvento} className="flex gap-3 mb-6">
                        <input 
                            type="text" 
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                            placeholder="Nombre del nuevo evento..." 
                            value={nuevoEvento} 
                            onChange={e => setNuevoEvento(e.target.value)} 
                            required 
                        />
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-md">
                            Crear
                        </button>
                    </form>
                    
                    <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {[...eventos].reverse().map(ev => (
                            <div key={ev.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-sm transition">
                                <div className="min-w-0 flex-1">
                                    <span className="font-bold text-lg text-gray-800 block truncate">{ev.nombre}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide ${ev.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {ev.activo ? "🟢 ACTIVO" : "🔴 CERRADO"}
                                    </span>
                                </div>
                                <div className="flex gap-1 ml-4">
                                    {/* --- BOTÓN ACTUALIZADO PARA DESCARGAR --- */}
                                    <button 
                                        onClick={() => descargarReporteExcel(ev.id, ev.nombre)} 
                                        className="p-2 hover:bg-white rounded-lg transition" 
                                        title="Descargar Excel"
                                    >📊</button>
                                    {ev.activo && (
                                        <button onClick={() => handleAccionEvento(ev.id, 'cerrar')} className="p-2 hover:bg-white rounded-lg" title="Cerrar">🏁</button>
                                    )}
                                    <button onClick={() => handleAccionEvento(ev.id, 'eliminar')} className="p-2 hover:bg-white rounded-lg" title="Borrar">🗑️</button>
                                </div>
                            </div>
                        ))}

                        {eventos.length === 0 && (
                            <p className="text-center text-gray-400 py-10 italic">No hay eventos registrados.</p>
                        )}
                    </div>
                </div>
                

                {/* 2. GESTIÓN DE PRODUCTOS */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 lg:col-span-2">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-blue-700">📦 Productos e Inventario</h2>
                        <div className="bg-gray-100 p-2 rounded-lg">
                            <select className="p-2 border rounded-md" value={selectedEventoId} onChange={e => cargarMenuEvento(e.target.value)}>
                                <option value="">🌍 Inventario Global (Tienda)</option>
                                {[...eventos]
                                    .filter(ev => ev.activo === true) // <-- EL FILTRO: Solo deja pasar los eventos activos
                                    .reverse()
                                    .map(ev => (
                                        <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <form onSubmit={crearProducto} className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                                <select className="w-full p-2.5 border rounded-lg" value={categoriaProd} onChange={e => setCategoriaProd(e.target.value as any)}>
                                    <option value="COCINA">🍽️ Cocina</option>
                                    <option value="TIENDA">🛒 Tienda</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                                <input type="text" className="w-full p-2.5 border rounded-lg" value={nombreProd} onChange={e => setNombreProd(e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Precio (Q)</label>
                                <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg" value={precioProd} onChange={e => setPrecioProd(e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input type="number" className="w-full p-2.5 border rounded-lg" placeholder="Stock" value={stockProd} onChange={e => setStockProd(e.target.value)} />
                            <input type="date" className="w-full p-2.5 border rounded-lg" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
                            <button className="md:col-span-2 bg-blue-600 text-white py-2.5 rounded-lg font-bold">💾 Guardar Producto</button>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3">Precio</th>
                                    <th className="px-4 py-3">Stock</th>
                                    <th className="px-4 py-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosMenu.map(p => (
                                    <tr key={p.id} className="border-b bg-white">
                                        <td className="px-4 py-3">{p.categoria}</td>
                                        <td className="px-4 py-3 font-bold">{p.nombre}</td>
                                        <td className="px-4 py-3">Q{p.precio.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-blue-600 font-bold">{p.stock ?? '∞'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => editarProducto(p)} className="hover:scale-125 transition-transform" title="Editar">✏️</button>
                                                <button onClick={() => eliminarProducto(p.id)} className="hover:scale-125 transition-transform text-red-500" title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. GESTIÓN DE CLIENTES */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 text-green-700">👥 Clientes (Billetera)</h2>
                    <form onSubmit={crearCliente} className="flex gap-3 mb-6">
                        <input type="text" className="flex-1 p-3 border rounded-lg" placeholder="Nombre..." value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} required />
                        <input type="number" className="w-24 p-3 border rounded-lg" placeholder="Q" value={saldoInicial} onChange={e => setSaldoInicial(e.target.value)} required />
                        <button className="bg-green-600 text-white px-6 rounded-lg font-bold">+</button>
                    </form>
                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {clientes.map(c => (
                            <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg">
                                <span className="font-medium">{c.nombre}</span>
                                <div className="flex gap-3 items-center">
                                    <span className="font-bold text-green-700">Q{c.saldo.toFixed(2)}</span>
                                    <button onClick={() => eliminarCliente(c)} className="text-red-400">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}