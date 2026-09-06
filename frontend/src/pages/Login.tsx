import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoIglesia from '../assets/logo.png'; // Ruta a tu imagen recortada
import { 
  User, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Store,
  Loader2
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [rolSeleccionado, setRolSeleccionado] = useState<'ADMIN' | 'CAJERO' | 'COCINA'>('ADMIN');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: Math.round((clientX / innerWidth) * 100),
      y: Math.round((clientY / innerHeight) * 100),
    });
  };

  const obtenerUsernamePorRol = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'admin';
      case 'CAJERO':
        return 'caja1';
      case 'COCINA':
        return 'cocina';
      default:
        return 'admin';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const username = obtenerUsernamePorRol(rolSeleccionado);
    const result = await login(username, password);

    if (result.success) {
      const rawUser = localStorage.getItem('church_user');
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;

      if (parsedUser?.role === 'COCINA') {
        navigate('/cocina', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      setError(result.message || 'Contraseña incorrecta o servidor no disponible');
    }
    setLoading(false);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#dbeafe] p-4 sm:p-6 font-sans select-none"
    >
      {/* 1. LUCES DE FONDO VIBRANTES CON MOVIMIENTO AUTÓNOMO */}
      <div className="absolute -top-16 -left-16 w-80 h-80 sm:w-[32rem] sm:h-[32rem] bg-gradient-to-br from-blue-600/75 via-blue-500/65 to-sky-400/60 rounded-full blur-[70px] sm:blur-[90px] animate-blob-float pointer-events-none" />
      <div className="absolute top-1/4 -right-16 w-96 h-96 sm:w-[34rem] sm:h-[34rem] bg-gradient-to-tl from-indigo-600/70 via-indigo-500/60 to-purple-400/50 rounded-full blur-[80px] sm:blur-[100px] animate-blob-reverse pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-88 h-88 sm:w-[30rem] sm:h-[30rem] bg-gradient-to-tr from-cyan-500/65 via-sky-400/60 to-blue-500/50 rounded-full blur-[75px] sm:blur-[95px] animate-pulse-slow pointer-events-none" />

      {/* Esfera reactiva al cursor */}
      <div 
        style={{
          top: `${mousePos.y}%`,
          left: `${mousePos.x}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute w-[20rem] h-[20rem] sm:w-[28rem] sm:h-[28rem] bg-gradient-to-r from-blue-500/45 to-indigo-400/40 rounded-full blur-[80px] transition-all duration-500 ease-out pointer-events-none"
      />

      <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* 2. TARJETA FLOTANTE PERSONALIZADA PARA LA IGLESIA */}
      <div className="relative z-10 w-full max-w-[390px] bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_25px_60px_rgba(30,58,138,0.15)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all">
        
        {/* Cabecera con Logotipo Institucional */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
          <div className="w-20 h-20 bg-white/90 rounded-2xl flex items-center justify-center p-2 shadow-md shadow-blue-500/10 border border-slate-100 mb-3 transition-transform active:scale-95">
            <img 
              src={logoIglesia} 
              alt="Logo Avivando la Fe" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-[#1b5e20] tracking-tight leading-tight uppercase">
            Avivando la Fe
          </h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Iglesia Cristiana
          </p>
          <span className="inline-block mt-2 px-3 py-0.5 bg-blue-50 border border-blue-200/80 rounded-full text-[10px] font-bold text-blue-700 uppercase tracking-wider">
            Punto de Venta
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50/90 border border-red-200 text-red-600 text-xs font-semibold rounded-xl text-center shadow-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          
          {/* Tipo de Usuario */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 ml-1 block">
              Tipo de usuario
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User size={16} />
              </div>
              <select
                value={rolSeleccionado}
                onChange={(e) => setRolSeleccionado(e.target.value as any)}
                className="w-full bg-slate-100/80 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl pl-10 pr-8 py-3 sm:py-3.5 outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="ADMIN">Administrador</option>
                <option value="CAJERO">Cajero</option>
                <option value="COCINA">Personal de Cocina</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Sede (Inactiva por el momento) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 ml-1 block">
              Sede
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <MapPin size={16} />
              </div>
              <select
                disabled
                className="w-full bg-slate-100/60 text-slate-400 text-xs font-medium rounded-xl pl-10 pr-8 py-3 sm:py-3.5 outline-none border border-transparent cursor-not-allowed appearance-none"
              >
                <option>Sucursal Central</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 ml-1 block">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-100/80 hover:bg-slate-100 text-slate-800 text-xs font-medium rounded-xl pl-10 pr-11 py-3 sm:py-3.5 outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition"
                aria-label="Alternar visibilidad"
              >
                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 sm:py-4 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100/90 flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-medium">
          <Store size={13} />
          <span>Sede: Sucursal Central</span>
        </div>

      </div>
    </div>
  );
}