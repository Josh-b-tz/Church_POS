import { useEffect, useState } from 'react';
import { ShoppingCart, ChefHat, Wallet, Store, Search, X, Trash2 } from 'lucide-react'; 
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext'; 

// --- INTERFACES DE TYPESCRIPT ---
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
    const { request, user } = useAuth();

    // --- ESTADOS DE DATOS ---
    const [evento, setEvento] = useState<Evento | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    
    // --- ESTADOS DE UI ---
    const [tabActiva, setTabActiva] = useState<'COCINA' | 'TIENDA'>('COCINA');
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

    // --- ESTADOS DE PAGO ---
    const [busqueda, setBusqueda] = useState("");
    const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [modoPago, setModoPago] = useState<'EFECTIVO' | 'SALDO'>('EFECTIVO');
    const [nombreTemporal, setNombreTemporal] = useState("");

    // --- EFECTOS ---
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // --- CARGA DE DATOS ---
    const cargarDatosIniciales = async () => {
        try {
            const respEvento = await request('/eventos/activo');
            setEvento(respEvento);

            if (respEvento && respEvento.id) {
                const respMenu = await request(`/productos/menu?eventoId=${respEvento.id}`);
                setProductos(respMenu);
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
            Swal.fire({
                icon: 'error',
                title: 'Sistema Cerrado',
                text: 'No se encontró un evento activo o no tienes permisos de acceso.'
            });
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DEL CARRITO ---
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
                    Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Stock máximo alcanzado', showConfirmButton: false, timer: 1000 });
                    return prev;
                }
                return prev.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    const eliminarProducto = (idProducto: number) => {
        setCarrito(prev => prev.filter(item => item.id !== idProducto));
    };

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // --- LÓGICA DE COBRO ---
    const handleCobrar = async () => {
        if (!evento) return;

        if (modoPago === 'SALDO') {
            if (!clienteSeleccionado) return Swal.fire({ title: 'Falta Cliente', text: 'Busca y selecciona un cliente.', icon: 'warning' });
            if (clienteSeleccionado.saldo < total) return Swal.fire({ title: 'Saldo Insuficiente', text: `Solo tiene Q${clienteSeleccionado.saldo.toFixed(2)}`, icon: 'error' });
        }

        try {
            const payload = {
                eventoId: evento.id,
                clienteId: modoPago === 'SALDO' ? clienteSeleccionado?.id : null,
                nombreTemporal: modoPago === 'EFECTIVO' ? nombreTemporal : null, 
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
                text: modoPago === 'SALDO' ? `Nuevo saldo: Q${(clienteSeleccionado!.saldo - total).toFixed(2)}` : 'Pago en efectivo registrado',
                timer: 2000,
                showConfirmButton: false
            });

            const respMenu = await request(`/productos/menu?eventoId=${evento.id}`);
            setProductos(respMenu);

            if (clienteSeleccionado) {
                setClienteSeleccionado(prev => prev ? ({ ...prev, saldo: prev.saldo - total }) : null);
            }

            setCarrito([]);
            setNombreTemporal("");
            
        } catch (error: any) {
            console.error("Error al cobrar:", error);
            Swal.fire({ title: 'Error', text: error.message || "No se pudo registrar la venta.", icon: 'error' });
        }
    };

    // --- BÚSQUEDA DE CLIENTES ---
    const buscarCliente = async (query: string) => {
        setBusqueda(query);
        if (query.length < 2) {
            setClientesEncontrados([]);
            return;
        }
        try {
            const res = await request(`/clientes/buscar?query=${query}`);
            setClientesEncontrados(res);
        } catch (error) { console.error("Error buscando cliente", error); }
    };

    const seleccionarCliente = (cliente: Cliente) => {
        setClienteSeleccionado(cliente);
        setClientesEncontrados([]); 
        setBusqueda(""); 
        setModoPago('SALDO'); 
    };

    const devolverSaldo = async (cliente: Cliente) => {
        if (cliente.saldo <= 0) return;
        const confirm = await Swal.fire({
            title: `Devolver Q${cliente.saldo.toFixed(2)}`,
            text: "¿Confirmas que has entregado el dinero en efectivo?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, entregado'
        });

        if (confirm.isConfirmed) {
            try {
                await request(`/clientes/${cliente.id}/liquidar`, { method: 'PATCH' });
                setClienteSeleccionado({ ...cliente, saldo: 0 }); 
                Swal.fire('Liquidado', 'El saldo ha quedado en 0.', 'success');
            } catch { Swal.fire('Error', 'No se pudo liquidar.', 'error'); }
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-100 text-gray-500 text-xl font-bold animate-pulse">Cargando sistema...</div>;
    if (!evento) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
            <Store size={64} className="text-gray-300 mb-4"/>
            <h2 className="text-2xl font-bold text-gray-600">No hay evento activo</h2>
            <p className="text-gray-400">Pide al administrador que inicie un evento.</p>
        </div>
    );

    const productosFiltrados = productos.filter(p => p.categoria === tabActiva);

    return (
        <div className="h-screen w-screen bg-gray-100 flex flex-col overflow-hidden font-sans">
            <header className="bg-slate-900 text-white px-6 py-3 shadow-md flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Wallet className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Church POS</h1>
                        <p className="text-xs text-blue-200 font-medium tracking-wide uppercase">{evento.nombre}</p>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-400">Usuario</p>
                    <p className="text-sm font-bold text-blue-400">{user?.username}</p>
                </div>
            </header>

            <main className="flex-1 p-4 flex gap-4 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => setTabActiva('COCINA')}
                            className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm
                                ${tabActiva === 'COCINA' 
                                    ? 'bg-orange-500 text-white shadow-orange-200 ring-2 ring-orange-200' 
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <ChefHat size={24} /> Cocina
                        </button>
                        <button
                            onClick={() => setTabActiva('TIENDA')}
                            className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm
                                ${tabActiva === 'TIENDA' 
                                    ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-200' 
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Store size={24} /> Tienda
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
                            {productosFiltrados.map((prod) => {
                                const sinStock = prod.stock !== null && prod.stock !== undefined && prod.stock <= 0;
                                return (
                                    <button 
                                        key={prod.id} 
                                        onClick={() => !sinStock && agregarProducto(prod)}
                                        disabled={sinStock}
                                        className={`relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-44 transition-all duration-200 group
                                            ${sinStock ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:shadow-md hover:border-blue-200 cursor-pointer active:scale-95'}
                                        `}
                                    >
                                        <div className={`p-3 rounded-full mb-3 transition-transform duration-300 group-hover:scale-110
                                            ${tabActiva === 'COCINA' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}
                                        `}>
                                            {tabActiva === 'COCINA' ? <ChefHat size={28} /> : <ShoppingCart size={28} />}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm leading-tight px-1 line-clamp-2">{prod.nombre}</h3>
                                        <p className="text-blue-600 font-extrabold mt-2 text-lg">Q{prod.precio.toFixed(2)}</p>
                                        {prod.stock !== null && prod.stock !== undefined && (
                                            <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded
                                                ${prod.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}
                                            `}>
                                                {prod.stock} un.
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {productosFiltrados.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                <Search size={48} className="mb-2 opacity-20" />
                                <p>No hay productos en esta categoría.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <ShoppingCart size={18} /> Tu Orden
                        </h2>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                            {carrito.length} items
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {carrito.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 opacity-50">
                                <ShoppingCart size={64} />
                                <p className="font-medium">El carrito está vacío</p>
                            </div>
                        ) : (
                            carrito.map(item => (
                                <div key={item.id} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 w-8 h-8 flex items-center justify-center rounded font-bold text-sm text-gray-600">
                                            {item.cantidad}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-800 line-clamp-1">{item.nombre}</p>
                                            <p className="text-xs text-gray-400">Q{item.precio.toFixed(2)} c/u</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-700">Q{(item.cantidad * item.precio).toFixed(2)}</span>
                                        <button 
                                            onClick={() => eliminarProducto(item.id)}
                                            className="text-gray-300 hover:text-red-500 transition p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                        <div className="relative">
                            {clienteSeleccionado ? (
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Cliente</p>
                                        <p className="font-bold text-blue-900">{clienteSeleccionado.nombre}</p>
                                        <p className="text-xs text-blue-600">Saldo Disp: Q{clienteSeleccionado.saldo.toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {clienteSeleccionado.saldo > 0 && (
                                            <button onClick={() => devolverSaldo(clienteSeleccionado)} className="text-xs bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition">
                                                Devolver
                                            </button>
                                        )}
                                        <button onClick={() => {setClienteSeleccionado(null); setModoPago('EFECTIVO')}} className="bg-white text-gray-400 hover:text-red-500 p-1 rounded border border-transparent hover:border-red-100 transition">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar cliente (Billetera)..." 
                                        className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
                                        value={busqueda}
                                        onChange={(e) => buscarCliente(e.target.value)}
                                    />
                                    {clientesEncontrados.length > 0 && (
                                        <div className="absolute bottom-full mb-2 w-full bg-white border shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
                                            {clientesEncontrados.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                                                    onClick={() => seleccionarCliente(c)}
                                                >
                                                    <span className="font-medium text-sm">{c.nombre}</span>
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Q{c.saldo.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {modoPago === 'EFECTIVO' && (
                            <input 
                                type="text" 
                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-slate-400 outline-none"
                                placeholder="Nombre del cliente (Opcional)"
                                value={nombreTemporal}
                                onChange={e => setNombreTemporal(e.target.value)}
                            />
                        )}

                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            <button 
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${modoPago === 'EFECTIVO' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setModoPago('EFECTIVO')}
                            >
                                💵 Efectivo
                            </button>
                            <button 
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${modoPago === 'SALDO' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => !clienteSeleccionado && Swal.fire({toast: true, position: 'top-end', icon: 'info', title: 'Busca un cliente primero', showConfirmButton: false, timer: 1500})}
                                disabled={!clienteSeleccionado}
                            >
                                💳 Billetera
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-4 px-1">
                                <span className="text-gray-500 font-medium">Total a Pagar</span>
                                <span className="text-3xl font-black text-slate-800 tracking-tight">Q{total.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={handleCobrar}
                                disabled={carrito.length === 0}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2
                                    ${carrito.length === 0 ? 'bg-gray-300 cursor-not-allowed' : (modoPago === 'SALDO' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-300')}
                                `}
                            >
                                {modoPago === 'SALDO' ? (
                                    <>CONFIRMAR CARGO <Wallet size={20}/></>
                                ) : (
                                    <>COBRAR EFECTIVO <span className="text-green-300">$$$</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}