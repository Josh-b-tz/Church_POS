import { useEffect, useState } from 'react';
import { ChefHat, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
// 1. Usamos nuestro sistema de seguridad centralizado
import { useAuth } from '../Context/AuthContext'; 

// --- DEFINICIÓN DE TIPOS ---
interface OrdenBackend {
    id: number;
    fecha: string;
    total: number;
    cliente?: { 
        nombre: string 
    }; 
    nombreClienteTemporal?: string;
    detalles: {
        id: number;
        producto: { 
            nombre: string;
            categoria: 'COCINA' | 'TIENDA'; 
        };
        cantidad: number;
    }[];
}

export default function CocinaPage() {
    // 2. Extraemos request para las llamadas y user para la interfaz
    const { request, user } = useAuth();
    
    const [ordenes, setOrdenes] = useState<OrdenBackend[]>([]);
    const [eventoId, setEventoId] = useState<number | null>(null);

    // 1. Al cargar, buscamos el evento activo usando 'request'
    useEffect(() => {
        request('/eventos/activo')
            .then(res => {
                if (res && res.id) setEventoId(res.id);
            })
            .catch(err => console.error("Error al buscar evento activo:", err));
    }, []);

    // 2. Long Polling: Buscar órdenes cada 2 segundos con seguridad automática
    useEffect(() => {
        if (!eventoId) return;

        const fetchOrdenes = async () => {
            try {
                // request ya nos devuelve el JSON directamente
                const data = await request(`/ordenes?eventoId=${eventoId}&estado=PENDIENTE`);
                setOrdenes(data);
            } catch (err) {
                console.error("Error cargando comandas:", err);
            }
        };

        fetchOrdenes(); 
        const intervalo = setInterval(fetchOrdenes, 2000); 

        return () => clearInterval(intervalo); 
    }, [eventoId, request]);

    // 3. Función para completar orden usando PATCH con 'request'
    const marcarListo = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Orden Lista?',
            text: `¿Ya despachaste todos los alimentos de la orden #${id}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#d33',
            confirmButtonText: '¡Sí, entregar!',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            // Usamos request con el método PATCH
            await request(`/ordenes/${id}/listo`, { method: 'PATCH' });
            
            Swal.fire({
                title: '¡Entregado!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });

            // Filtramos localmente para que desaparezca al instante
            setOrdenes(prev => prev.filter(o => o.id !== id));
        } catch (error: any) {
            Swal.fire('Error', error.message || 'No se pudo actualizar la orden', 'error');
        }
    };

    // --- FILTRADO DE COMANDAS ---
    const ordenesCocina = ordenes.filter(o => 
        o.detalles.some(d => d.producto.categoria === 'COCINA')
    );

    return (
        <div className="min-h-screen bg-slate-800 text-white p-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-600 pb-4">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-gray-400 hover:text-white transition p-2 bg-slate-700 rounded-lg">
                         &larr; <span className="hidden md:inline">Volver</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <ChefHat className="text-yellow-400" size={32} />
                        <div>
                            <h1 className="text-2xl font-bold">Monitor de Cocina</h1>
                            <p className="text-xs text-slate-400 font-mono">USUARIO: {user?.username}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {ordenesCocina.length > 0 && (
                        <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full animate-pulse font-bold shadow-lg shadow-red-900/50">
                            {ordenesCocina.length} PENDIENTES
                        </span>
                    )}
                    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">En Vivo</span>
                    </div>
                </div>
            </header>

            {ordenesCocina.length === 0 ? (
                <div className="text-center text-slate-500 mt-24">
                    <ChefHat size={80} className="mx-auto mb-4 opacity-10"/>
                    <p className="text-2xl font-light">Cocina despejada</p>
                    <p className="text-sm mt-2">Esperando nuevas comandas de comida...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {ordenesCocina.map(orden => {
                        const itemsCocina = orden.detalles.filter(d => d.producto.categoria === 'COCINA');
                        if (itemsCocina.length === 0) return null;

                        return (
                            <div key={orden.id} className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border-t-8 border-orange-500 flex flex-col h-full transform transition hover:scale-[1.02]">
                                {/* CABECERA DE LA COMANDA */}
                                <div className={`p-4 flex justify-between items-start border-b 
                                    ${orden.cliente ? 'bg-blue-50' : (orden.nombreClienteTemporal ? 'bg-orange-50' : 'bg-slate-50')}`}>
                                    
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">COMANDA #{orden.id}</span>
                                        {orden.cliente ? (
                                            <span className="font-black text-xl text-blue-900 truncate">{orden.cliente.nombre}</span>
                                        ) : (
                                            <span className="font-black text-xl text-orange-900 truncate">{orden.nombreClienteTemporal || 'Cliente General'}</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border shadow-sm">
                                        <Clock size={12} />
                                        {new Date(orden.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                
                                {/* DETALLE DE PLATILLOS */}
                                <div className="p-5 flex-1 bg-yellow-50/30">
                                    <ul className="space-y-4">
                                        {itemsCocina.map(detalle => (
                                            <li key={detalle.id} className="flex items-center gap-4">
                                                <div className="bg-slate-800 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                                                    {detalle.cantidad}
                                                </div>
                                                <span className="font-bold text-slate-700 text-lg leading-tight">
                                                    {detalle.producto.nombre}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* BOTÓN DE ACCIÓN */}
                                <button 
                                    onClick={() => marcarListo(orden.id)}
                                    className="w-full bg-slate-800 hover:bg-green-600 text-white py-5 font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 active:bg-green-700"
                                >
                                    <CheckCircle size={24} /> DESPACHAR
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}