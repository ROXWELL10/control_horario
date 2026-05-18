import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatSeconds, formatTimeOnly, formatDate } from '../utils/formatters';
import { 
  Calendar, 
  Filter, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Coffee, 
  Info,
  TrendingUp
} from 'lucide-react';

export default function EmpleadoHistorial() {
  const { shifts, currentUser } = useApp();
  
  // States
  const [filterPreset, setFilterPreset] = useState('mes'); // 'semana', 'mes', 'todos', 'personalizado'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedShiftId, setExpandedShiftId] = useState(null);

  // Filter personal shifts
  const personalShifts = useMemo(() => {
    return shifts.filter(s => s.usuario_id === currentUser.id);
  }, [shifts, currentUser.id]);

  // Apply date filters
  const filteredShifts = useMemo(() => {
    const now = new Date();
    
    return personalShifts.filter(shift => {
      const shiftDate = new Date(shift.fecha);
      
      if (filterPreset === 'semana') {
        // Current week (last 7 days for simplicity, or calendar week)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return shiftDate >= oneWeekAgo;
      }
      
      if (filterPreset === 'mes') {
        // Current month
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return shiftDate >= firstDayOfMonth;
      }

      if (filterPreset === 'personalizado') {
        if (!customStart && !customEnd) return true;
        
        let startMatch = true;
        let endMatch = true;
        
        if (customStart) {
          const startDate = new Date(customStart + 'T00:00:00');
          startMatch = shiftDate >= startDate;
        }
        if (customEnd) {
          const endDate = new Date(customEnd + 'T23:59:59');
          endMatch = shiftDate <= endDate;
        }
        return startMatch && endMatch;
      }

      return true; // 'todos' preset
    });
  }, [personalShifts, filterPreset, customStart, customEnd]);

  // Dynamic Metrics calculations
  const metrics = useMemo(() => {
    const totalDays = filteredShifts.length;
    const totalSeconds = filteredShifts.reduce((acc, curr) => acc + (curr.tiempo_neto || 0), 0);
    const avgSeconds = totalDays > 0 ? Math.floor(totalSeconds / totalDays) : 0;
    
    return {
      totalDays,
      totalNetTime: formatSeconds(totalSeconds),
      avgNetTime: formatSeconds(avgSeconds),
      hoursDecimal: (totalSeconds / 3600).toFixed(2)
    };
  }, [filteredShifts]);

  const toggleExpand = (shiftId) => {
    setExpandedShiftId(expandedShiftId === shiftId ? null : shiftId);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header Card with Filter Presets */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-bold text-white">Filtros de Historial</h3>
          </div>
          
          {/* Preset Selectors */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'semana', label: 'Semana Actual' },
              { id: 'mes', label: 'Mes Actual' },
              { id: 'todos', label: 'Historial Completo' },
              { id: 'personalizado', label: 'Personalizado...' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setFilterPreset(preset.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  filterPreset === preset.id
                    ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/10'
                    : 'bg-dark-850 border-dark-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Calendar Inputs (if Custom preset is selected) */}
        {filterPreset === 'personalizado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-dark-850 rounded-2xl border border-dark-850 animate-slideDown">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total worked days */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Jornadas Registradas</span>
            <div className="text-2xl font-extrabold text-white mt-0.5">{metrics.totalDays}</div>
          </div>
        </div>

        {/* Total Worked Hours */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Tiempo Neto Total</span>
            <div className="text-2xl font-extrabold text-white mt-0.5 font-mono tracking-wide">{metrics.totalNetTime}</div>
            <div className="text-[10px] text-emerald-400 italic mt-0.5">Equivale a {metrics.hoursDecimal} horas</div>
          </div>
        </div>

        {/* Average Worked Hours */}
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Promedio Diario Neto</span>
            <div className="text-2xl font-extrabold text-white mt-0.5 font-mono tracking-wide">{metrics.avgNetTime}</div>
          </div>
        </div>
      </div>

      {/* Shifts History List */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white mb-2">Desglose de Jornadas</h4>

        {filteredShifts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-650 mx-auto" />
            <p className="text-slate-400 font-semibold text-sm">No se encontraron jornadas en este rango</p>
            <p className="text-xs text-slate-500">Prueba ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShifts.map(shift => {
              const isExpanded = expandedShiftId === shift.id;
              const hasPausas = shift.pausas && shift.pausas.length > 0;
              
              // Sum of pause intervals
              const totalPauseSeconds = shift.pausas.reduce((acc, curr) => {
                if (curr.hora_inicio && curr.hora_fin) {
                  return acc + Math.floor((new Date(curr.hora_fin) - new Date(curr.hora_inicio)) / 1000);
                }
                return acc;
              }, 0);

              // Gross Shift interval
              const grossSeconds = Math.floor((new Date(shift.hora_salida || Date.now()) - new Date(shift.hora_entrada)) / 1000);

              return (
                <div 
                  key={shift.id}
                  className={`border border-dark-800 rounded-2xl transition-all duration-200 ${
                    isExpanded ? 'bg-dark-850 border-slate-700' : 'bg-dark-850/50 hover:bg-dark-850 hover:border-slate-800'
                  }`}
                >
                  {/* Collapsed Row header */}
                  <div 
                    onClick={() => toggleExpand(shift.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-dark-800 border border-dark-750 flex items-center justify-center text-slate-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {formatDate(shift.fecha, true)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatTimeOnly(shift.hora_entrada)} - {shift.hora_salida ? formatTimeOnly(shift.hora_salida) : 'En progreso'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                      {/* Pauses Counter */}
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Pausas</span>
                        <span className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5 justify-end">
                          <Coffee className="w-3.5 h-3.5 text-yellow-500" />
                          {shift.pausas.length}
                        </span>
                      </div>

                      {/* Net Hours */}
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Tiempo Neto</span>
                        <span className="text-sm font-mono font-bold text-brand-400 mt-0.5">
                          {formatSeconds(shift.tiempo_neto)}
                        </span>
                      </div>

                      {/* Expand Chevron */}
                      <div className="text-slate-400 ml-2 hidden md:block">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-dark-800 p-5 space-y-6 bg-dark-900/40 rounded-b-2xl animate-fadeIn">
                      
                      {/* Formula & Breakdown Check */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-dark-850 border border-dark-800 rounded-xl p-3.5 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duración Bruta</span>
                          <span className="text-sm font-mono text-slate-300 font-semibold">{formatSeconds(grossSeconds)}</span>
                        </div>
                        <div className="bg-dark-850 border border-dark-800 rounded-xl p-3.5 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Descontado (Pausas)</span>
                          <span className="text-sm font-mono text-yellow-500 font-semibold">-{formatSeconds(totalPauseSeconds)}</span>
                        </div>
                        <div className="bg-dark-850 border border-brand-500/20 rounded-xl p-3.5 flex flex-col bg-brand-500/5">
                          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-1">Cómputo Neto Efectivo</span>
                          <span className="text-sm font-mono text-white font-bold">{formatSeconds(shift.tiempo_neto)}</span>
                        </div>
                      </div>

                      {/* Pauses List Details */}
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Detalle de Interrupciones</h5>
                        
                        {!hasPausas ? (
                          <p className="text-xs text-slate-500 italic p-3 bg-dark-850 rounded-xl border border-dark-800">
                            No se realizaron pausas durante esta jornada.
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {shift.pausas.map((pause, pIdx) => {
                              const pauseDuration = pause.hora_fin 
                                ? Math.floor((new Date(pause.hora_fin) - new Date(pause.hora_inicio)) / 1000)
                                : Math.floor((Date.now() - new Date(pause.hora_inicio)) / 1000);

                              return (
                                <div 
                                  key={pause.id || pIdx}
                                  className="flex items-center justify-between p-3.5 bg-dark-850 rounded-xl border border-dark-800 text-xs hover:border-slate-800/80 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-dark-800 text-yellow-500 flex items-center justify-center shrink-0">
                                      <Coffee className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-200">Motivo: {pause.motivo}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        {formatTimeOnly(pause.hora_inicio)} - {pause.hora_fin ? formatTimeOnly(pause.hora_fin) : 'En progreso'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="font-mono text-slate-300 font-semibold bg-dark-800 px-3 py-1 rounded-lg">
                                    {formatSeconds(pauseDuration)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Formula Integrity Disclaimer */}
                      <div className="p-3 bg-brand-500/5 rounded-xl border border-brand-500/10 flex gap-2.5 text-[11px] text-brand-400">
                        <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                        <span className="leading-relaxed">
                          <strong>Cálculo Neto Aplicado:</strong> Ef. = (Salida {shift.hora_salida ? formatTimeOnly(shift.hora_salida) : '--:--:--'} - Entrada {formatTimeOnly(shift.hora_entrada)}) - Suma de Pausas ({formatSeconds(totalPauseSeconds)}). Los cálculos son auditados por la plataforma para nómina de SAMMERS-JEANS.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
