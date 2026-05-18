import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatTimeOnly, formatDate } from '../utils/formatters';
import { ShieldAlert, Search, Calendar, UserCheck } from 'lucide-react';

export default function AdminAuditoria() {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter audit logs by Admin name, Employee name or edited field
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      return (
        log.admin_nombre.toLowerCase().includes(query) ||
        log.usuario_nombre.toLowerCase().includes(query) ||
        log.campo_modificado.toLowerCase().includes(query) ||
        log.motivo_edicion.toLowerCase().includes(query)
      );
    });
  }, [auditLogs, searchQuery]);

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
            Log de Auditoría Inmutable
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Registro inalterable de modificaciones manuales de horas laboradas realizadas por los administradores.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por colaborador, admin, motivo..."
            className="w-full bg-dark-850 border border-dark-800 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-700 transition-colors"
          />
        </div>
      </div>

      {/* Audit timeline list */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-6">
        <h4 className="text-sm font-bold text-white">Log de Historial de Ajustes</h4>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-650 mx-auto" />
            <p className="text-slate-400 font-semibold text-sm">No se encontraron registros de auditoría</p>
            <p className="text-xs text-slate-500">No se han registrado modificaciones manuales o ninguna coincide con el criterio.</p>
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-dark-850">
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="relative pl-12 group"
              >
                {/* Node icon indicator */}
                <div className="absolute left-3 top-1 w-6.5 h-6.5 rounded-full bg-dark-800 border-2 border-yellow-500 flex items-center justify-center text-[10px] text-yellow-500 font-bold z-10 transition-transform group-hover:scale-110 shadow-lg">
                  !
                </div>

                {/* Audit Detail Panel */}
                <div className="bg-dark-850/60 border border-dark-800 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 space-y-4">
                  {/* Row header details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-800 pb-3">
                    <div className="text-xs">
                      <span className="text-slate-400">Admin: </span>
                      <strong className="text-white font-semibold">{log.admin_nombre}</strong>
                      <span className="text-slate-450 ml-1.5 mr-1.5">•</span>
                      <span className="text-slate-400">Ajuste a: </span>
                      <strong className="text-white font-semibold">{log.usuario_nombre}</strong>
                    </div>
                    
                    {/* Log date */}
                    <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(log.fecha_cambio)} a las {formatTimeOnly(log.fecha_cambio)}
                    </div>
                  </div>

                  {/* Fields adjusted values diff representation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-dark-900/50 rounded-xl p-3 border border-dark-800">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campo Afectado</span>
                      <span className="text-xs font-semibold text-brand-400">{log.campo_modificado}</span>
                    </div>

                    <div className="bg-dark-900/50 rounded-xl p-3 border border-dark-850">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Valor Previo</span>
                      <span className="text-xs font-mono text-red-400/90 line-through">
                        {log.valor_anterior.includes('T') ? formatTimeOnly(log.valor_anterior) : log.valor_anterior}
                      </span>
                    </div>

                    <div className="bg-dark-900/50 rounded-xl p-3 border border-dark-850">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Valor Modificado</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {log.valor_nuevo.includes('T') ? formatTimeOnly(log.valor_nuevo) : log.valor_nuevo}
                      </span>
                    </div>
                  </div>

                  {/* Justification Comment */}
                  <div className="p-3 bg-yellow-500/5 rounded-xl border border-yellow-500/10 text-xs flex gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-wider block mb-1">Justificación del Administrador</span>
                      <p className="text-slate-300 leading-relaxed italic">"{log.motivo_edicion}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
