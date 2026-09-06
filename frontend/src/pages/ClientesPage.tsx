import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../Context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { 
  Users, 
  Wallet, 
  Search, 
  UserPlus, 
  Trash2, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Coins
} from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  saldo: number;
}

export default function ClientesPage() {
  const { request } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const res = await request('/clientes/buscar?query=');
      setClientes(res);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Crear nuevo cliente / Abrir billetera
  const crearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;

    try {
      await request('/clientes', {
        method: 'POST',
        body: {
          nombre: nombreNuevo.trim(),
          saldo: saldoInicial ? parseFloat(saldoInicial) : 0
        }
      });

      Swal.fire({
        icon: 'success',
        title: 'Billetera Creada',
        text: `Se registró a ${nombreNuevo} exitosamente.`,
        timer: 1500,
        showConfirmButton: false
      });

      setNombreNuevo('');
      setSaldoInicial('');
      cargarClientes();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'No se pudo crear la billetera', 'error');
    }
  };

  // 2. Recargar saldo a la billetera virtual
  const recargarSaldo = async (cliente: Cliente) => {
    const { value: monto } = await Swal.fire({
      title: `Recargar a ${cliente.nombre}`,
      input: 'number',
      inputLabel: 'Monto en Quetzales (Q)',
      inputPlaceholder: 'Ej. 50.00',
      inputAttributes: {
        step: '0.01',
        min: '0.01'
      },
      showCancelButton: true,
      confirmButtonText: 'Abonar Saldo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      inputValidator: (val) => {
        if (!val || parseFloat(val) <= 0) {
          return 'Debes ingresar un monto válido mayor a 0';
        }
        return null;
      }
    });

    if (monto) {
      const nuevoSaldoTotal = cliente.saldo + parseFloat(monto);
      try {
        await request(`/clientes`, {
          method: 'POST',
          body: {
            id: cliente.id,
            nombre: cliente.nombre,
            saldo: nuevoSaldoTotal
          }
        });

        Swal.fire({
          icon: 'success',
          title: 'Saldo Abonado',
          text: `Nuevo saldo disponible: Q${nuevoSaldoTotal.toFixed(2)}`,
          timer: 1500,
          showConfirmButton: false
        });

        cargarClientes();
      } catch (err: any) {
        Swal.fire('Error', err.message || 'No se pudo recargar el saldo', 'error');
      }
    }
  };

  // 3. Devolver / Liquidar saldo en efectivo
  const liquidarSaldo = async (cliente: Cliente) => {
    if (cliente.saldo <= 0) {
      return Swal.fire({
        icon: 'info',
        title: 'Sin Saldo',
        text: 'Este cliente no tiene saldo pendiente por devolver.'
      });
    }

    const confirm = await Swal.fire({
      title: `Devolver Q${cliente.saldo.toFixed(2)}`,
      text: `¿Confirmas que entregas Q${cliente.saldo.toFixed(2)} en efectivo a ${cliente.nombre}? Su saldo quedará en Q0.00.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Sí, entregar efectivo',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await request(`/clientes/${cliente.id}/liquidar`, { method: 'PATCH' });
        Swal.fire('Saldo Liquidado', 'La cuenta ha quedado en Q0.00.', 'success');
        cargarClientes();
      } catch (err: any) {
        Swal.fire('Error', err.message || 'No se pudo liquidar la cuenta.', 'error');
      }
    }
  };

  // 4. Eliminar cliente
  const eliminarCliente = async (cliente: Cliente) => {
    if (cliente.saldo > 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'Saldo Pendiente',
        text: `El cliente aún tiene Q${cliente.saldo.toFixed(2)}. Liquídalo en efectivo antes de borrarlo.`
      });
    }

    const confirm = await Swal.fire({
      title: `¿Eliminar a ${cliente.nombre}?`,
      text: 'Sus registros de ventas pasadas quedarán preservados como "Archivado".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        await request(`/clientes/${cliente.id}`, { method: 'DELETE' });
        Swal.fire('Eliminado', 'El cliente fue borrado del sistema.', 'success');
        cargarClientes();
      } catch (err: any) {
        Swal.fire('Error', err.message || 'No se pudo borrar el cliente.', 'error');
      }
    }
  };

  // Filtro de búsqueda
  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalDineroCustodia = clientes.reduce((acc, c) => acc + c.saldo, 0);

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera y Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 leading-tight">Clientes & Billetera Virtual</h2>
                <p className="text-xs text-slate-400">Control de fondos prepagados y saldos de la congregación</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Fondos en Custodia</p>
              <p className="text-2xl font-black mt-0.5">Q{totalDineroCustodia.toFixed(2)}</p>
            </div>
            <Coins size={32} className="text-emerald-300 opacity-80" />
          </div>
        </div>

        {/* Formulario para Crear / Abrir Billetera */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <UserPlus size={16} className="text-emerald-600" /> Registrar Nuevo Hermano / Billetera
          </h3>

          <form onSubmit={crearCliente} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Nombre Completo
              </label>
              <input 
                type="text"
                placeholder="Ej. Hno. Carlos Gómez"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Saldo Inicial (Q)
              </label>
              <input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-[0.99]"
              >
                Crear Billetera
              </button>
            </div>
          </form>
        </div>

        {/* Tabla de Cuentas Virtuales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              {clientesFiltrados.length} billeteras activas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Hermano / Cliente</th>
                  <th className="px-5 py-3">Saldo en Billetera</th>
                  <th className="px-5 py-3 text-center">Acciones de Billetera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {clientesFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                      #{c.id}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-800 text-sm">
                      {c.nombre}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black ${
                        c.saldo > 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        Q{c.saldo.toFixed(2)}
                      </span>
                    </td>

                    {/* Acciones de Billetera */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botón Recargar */}
                        <button
                          onClick={() => recargarSaldo(c)}
                          title="Recargar Saldo (Abono)"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition font-bold text-[11px]"
                        >
                          <ArrowDownCircle size={14} />
                          <span>Recargar</span>
                        </button>

                        {/* Botón Devolver / Liquidar */}
                        <button
                          onClick={() => liquidarSaldo(c)}
                          disabled={c.saldo <= 0}
                          title="Devolver saldo en efectivo"
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition font-bold text-[11px] ${
                            c.saldo > 0
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <ArrowUpCircle size={14} />
                          <span>Devolver</span>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => eliminarCliente(c)}
                          title="Eliminar Cuenta"
                          className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {clientesFiltrados.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No se encontraron clientes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}