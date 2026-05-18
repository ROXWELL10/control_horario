import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatSeconds, formatTimeOnly } from '../utils/formatters';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Coffee,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard({ setCurrentTab, setSelectedEmployeeForAudit }) {
  const { users, shifts } = useApp();

  // Determine current daily state for each employee
  const employeesRealTime = useMemo(() => {
    return users.filter(u => u.rol === 'Empleado').map(user => {
      // Find active shift for today
      // An active shift is any shift where hora_salida is null, or state is 'activo'/'pausado'
      const activeShift = shifts.find(s => s.usuario_id === user.id && s.estado !== 'finalizado');
      
      let status = 'inactivo';
      let entryTime = null;
      let currentPauseReason = null;
      let elapsedToday = 0;
      let activeShiftId = null;

      if (activeShift) {
        status = activeShift.estado; // 'activo' or 'pausado'
        entryTime = activeShift.hora_entrada;
        activeShiftId = activeShift.id;
        
        // Calculate elapsed net time up to this instant
        const completedPausesMs = activeShift.pausas.reduce((acc, p) => {
          if (p.hora_fin) {
            return acc + (new Date(p.hora_fin) - new Date(p.hora_inicio));
          }
          return acc;
        }, 0);

        const currentOpenPause = activeShift.pausas.find(p => p.hora_fin === null);
        if (currentOpenPause) {
          currentPauseReason = currentOpenPause.motivo;
        }

        const now = Date.now();
        const start = new Date(entryTime).getTime();
        const grossMs = now - start;
        
        let activePauseMs = 0;
        if (currentOpenPause) {
          activePauseMs = now - new Date(currentOpenPause.hora_inicio).getTime();
        }

        const totalPauseMs = completedPausesMs + activePauseMs;
        elapsedToday = Math.max(0, Math.floor((grossMs - totalPauseMs) / 1000));
      } else {
        // Find if they finished a shift today
        const todayStr = new Date().toISOString().split('T')[0];
        const completedToday = shifts.find(s => s.usuario_id === user.id && s.fecha === todayStr && s.estado === 'finalizado');
        if (completedToday) {
          status = 'finalizado';
          entryTime = completedToday.hora_entrada;
          elapsedToday = completedToday.tiempo_neto;
        }
      }

      return {
        ...user,
        status,
        entryTime,
        currentPauseReason,
        elapsedToday,
        activeShiftId
      };
    });
  }, [users, shifts]);

  // Aggregate counts
  const stats = useMemo(() => {
    let activos = 0;
    let pausados = 0;
    let inactivos = 0;
    let finalizados = 0;

    employeesRealTime.forEach(emp => {
      if (emp.status === 'activo') activos++;
      else if (emp.status === 'pausado') pausados++;
      else if (emp.status === 'inactivo') inactivos++;
      else if (emp.status === 'finalizado') finalizados++;
    });

    const total = employeesRealTime.length;
    const asistenciaPct = total > 0 ? Math.round(((activos + pausados + finalizados) / total) * 100) : 0;

    return {
      activos,
      pausados,
      inactivos,
      finalizados,
      total,
      asistenciaPct
    };
  }, [employeesRealTime]);

  const handleAuditClick = (user) => {
    setSelectedEmployeeForAudit(user.id);
    setCurrentTab('admin-historial');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Consola del Administrador
          </h3>
          <p className="text-xs text-brand-100 leading-relaxed max-w-xl">
            Monitorea en tiempo real el estado de asistencia de la plantilla de SAMMERS-JEANS, audita historiales de jornada y procesa reportes de nómina consolidados.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center shrink-0 z-10">
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-200">Asistencia Hoy</span>
          <div className="text-3xl font-extrabold mt-1">{stats.asistenciaPct}%</div>
        </div>
        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-12 translate-x-12 shrink-0 pointer-events-none" />
      </div>

      {/* Grid of aggregated stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        
        {/* Active Cards */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Personal Activo</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">{stats.activos}</div>
          </div>
        </div>

        {/* Paused Cards */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Personal en Pausa</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">{stats.pausados}</div>
          </div>
        </div>

        {/* Finished Cards */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Jornadas Listas Hoy</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">{stats.finalizados}</div>
          </div>
        </div>

        {/* Inactive Cards */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Personal Inactivo</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">{stats.inactivos}</div>
          </div>
        </div>

      </div>

      {/* Real-time Employee List */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Monitoreo en Tiempo Real</h4>
            <p className="text-xs text-slate-500 mt-1">Lista actual del personal en confección y logística</p>
          </div>
          <span className="flex items-center gap-2 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            En vivo
          </span>
        </div>

        <div className="overflow-x-auto border border-dark-800 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-850 text-slate-400 font-bold border-b border-dark-800">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Cargo</th>
                <th className="p-4">Estado Actual</th>
                <th className="p-4">Hora Entrada</th>
                <th className="p-4">Tiempo Neto Acumulado</th>
                <th className="p-4 text-right">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 bg-dark-900/50">
              {employeesRealTime.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 italic">
                    No hay colaboradores registrados en el sistema.
                  </td>
                </tr>
              ) : (
                employeesRealTime.map(emp => {
                  let statusTag = '';
                  let statusColor = '';
                  let dotColor = '';

                  switch (emp.status) {
                    case 'activo':
                      statusTag = 'Activo';
                      statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      dotColor = 'bg-emerald-500';
                      break;
                    case 'pausado':
                      statusTag = `Pausado: ${emp.currentPauseReason}`;
                      statusColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                      dotColor = 'bg-yellow-500';
                      break;
                    case 'finalizado':
                      statusTag = 'Jornada Finalizada';
                      statusColor = 'bg-brand-500/10 text-brand-400 border-brand-500/20';
                      dotColor = 'bg-brand-500';
                      break;
                    default:
                      statusTag = 'Inactivo';
                      statusColor = 'bg-slate-800 text-slate-400 border-slate-700/50';
                      dotColor = 'bg-slate-500';
                  }

                  return (
                    <tr key={emp.id} className="hover:bg-dark-850/40 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-dark-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-dark-750">
                          {emp.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{emp.nombre}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{emp.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{emp.cargo || 'Sin cargo asignado'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${emp.status === 'activo' ? 'animate-pulse' : ''}`} />
                          {statusTag}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">
                        {emp.entryTime ? formatTimeOnly(emp.entryTime) : '--:--:--'}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-200">
                        {emp.elapsedToday > 0 ? formatSeconds(emp.elapsedToday) : '00:00:00'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleAuditClick(emp)}
                          className="p-1.5 bg-dark-850 hover:bg-dark-750 border border-dark-850 hover:border-slate-750 rounded-lg text-slate-400 hover:text-white transition-all inline-flex items-center gap-1 group"
                        >
                          <span className="text-[10px] font-bold uppercase pl-1.5">Auditar</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
