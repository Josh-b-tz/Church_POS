import { Link } from 'react-router-dom';
import { Wallet, ChefHat, Settings, LogOut, User } from 'lucide-react'; // Añadimos LogOut y User
import { useAuth } from '../Context/AuthContext'; // Asegúrate que la ruta sea correcta (Context o context)

export default function HomePage() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col">
            
            {/* BARRA SUPERIOR DE USUARIO */}
            <div className="flex justify-between items-center max-w-6xl mx-auto w-full mb-8 bg-slate-700/30 p-4 rounded-2xl backdrop-blur-sm border border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                        <User className="text-blue-400" size={20} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Sesión iniciada</p>
                        <p className="text-white font-medium">{user?.username} <span className="text-slate-500 mx-1">|</span> <span className="text-blue-400 text-sm">{user?.role}</span></p>
                    </div>
                </div>
                
                <button 
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl transition duration-300 border border-red-500/20"
                >
                    <LogOut size={18} />
                    <span className="font-bold text-sm">Salir</span>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    <h1 className="text-5xl font-extrabold text-white text-center mb-2 tracking-tight">Church <span className="text-blue-500">POS</span></h1>
                    <p className="text-slate-400 text-center mb-12">Selecciona el módulo para trabajar hoy</p>
                    
                    {/* GRID DINÁMICO SEGÚN ROL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* TARJETA CAJA: Visible para ADMIN y CAJERO */}
                        {(user?.role === 'ADMIN' || user?.role === 'CAJERO') && (
                            <Link to="/caja" className="group">
                                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition duration-300 flex flex-col items-center h-full border-b-4 border-blue-500">
                                    <div className="bg-blue-100 p-4 rounded-full mb-6 group-hover:bg-blue-600 group-hover:text-white transition transform group-hover:rotate-12">
                                        <Wallet size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">Caja</h2>
                                    <p className="text-slate-500 text-center mt-2">Registrar ventas y cobros en efectivo.</p>
                                </div>
                            </Link>
                        )}

                        {/* TARJETA COCINA: Visible para ADMIN y COCINA */}
                        {(user?.role === 'ADMIN' || user?.role === 'COCINA') && (
                            <Link to="/cocina" className="group">
                                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition duration-300 flex flex-col items-center h-full border-b-4 border-orange-500">
                                    <div className="bg-orange-100 p-4 rounded-full mb-6 group-hover:bg-orange-600 group-hover:text-white transition transform group-hover:rotate-12">
                                        <ChefHat size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">Cocina</h2>
                                    <p className="text-slate-500 text-center mt-2">Monitor de pedidos pendientes.</p>
                                </div>
                            </Link>
                        )}

                        {/* TARJETA ADMIN: ÚNICAMENTE visible para ADMIN */}
                        {user?.role === 'ADMIN' && (
                            <Link to="/admin" className="group">
                                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition duration-300 flex flex-col items-center h-full border-b-4 border-purple-500">
                                    <div className="bg-purple-100 p-4 rounded-full mb-6 group-hover:bg-purple-600 group-hover:text-white transition transform group-hover:rotate-12">
                                        <Settings size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">Admin</h2>
                                    <p className="text-slate-500 text-center mt-2">Gestión de eventos, productos y reportes.</p>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* MENSAJE SI NO TIENE ROLES (Caso extremo) */}
                    {user?.role !== 'ADMIN' && user?.role !== 'CAJERO' && user?.role !== 'COCINA' && (
                        <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <p className="text-slate-400">Tu cuenta no tiene módulos asignados aún.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}