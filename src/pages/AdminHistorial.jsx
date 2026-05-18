import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatSeconds, formatTimeOnly, formatDate } from '../utils/formatters';
import { 
  Search, 
  Calendar, 
  Download, 
  Printer, 
  Edit3, 
  Clock, 
  Coffee, 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

export default function AdminHistorial({ selectedEmployeeId, setSelectedEmployeeId }) {
  const { 
    shifts, 
    users, 
    motivosPausa, 
    editarRegistroManual 
  } = useApp();

  // Filters state
  const [filterPreset, setFilterPreset] = useState('todos'); // 'semana', 'mes', 'todos'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal Edit state
  const [editShift, setEditShift] = useState(null);
  const [editEntrada, setEditEntrada] = useState('');
  const [editSalida, setEditSalida] = useState('');
  const [editPausas, setEditPausas] = useState([]);
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [editError, setEditError] = useState('');

  // 1. Filter global shifts
  const processedShifts = useMemo(() => {
    return shifts.map(shift => {
      const user = users.find(u => u.id === shift.usuario_id);
      return {
        ...shift,
        usuario_nombre: user ? user.nombre : 'Usuario Desactivado',
        usuario_email: user ? user.email : '',
      };
    });
  }, [shifts, users]);

  const filteredShifts = useMemo(() => {
    const now = new Date();

    return processedShifts.filter(shift => {
      // 1. Employee filter
      if (selectedEmployeeId && selectedEmployeeId !== 'todos') {
        if (shift.usuario_id !== selectedEmployeeId) return false;
      }

      // 2. Date presets
      const shiftDate = new Date(shift.fecha);
      if (filterPreset === 'semana') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (shiftDate < oneWeekAgo) return false;
      } else if (filterPreset === 'mes') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (shiftDate < firstDayOfMonth) return false;
      }

      // 3. Custom Date Range
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (shiftDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (shiftDate > end) return false;
      }

      return true;
    });
  }, [processedShifts, selectedEmployeeId, filterPreset, startDate, endDate]);

  // Aggregate stats
  const aggregates = useMemo(() => {
    const totalDays = filteredShifts.length;
    const totalSeconds = filteredShifts.reduce((acc, curr) => acc + (curr.tiempo_neto || 0), 0);
    const totalPauseSeconds = filteredShifts.reduce((acc, curr) => {
      const shiftPausesSum = curr.pausas.reduce((pAcc, pCurr) => {
        if (pCurr.hora_inicio && pCurr.hora_fin) {
          return pAcc + Math.floor((new Date(pCurr.hora_fin) - new Date(pCurr.hora_inicio)) / 1000);
        }
        return pAcc;
      }, 0);
      return acc + shiftPausesSum;
    }, 0);

    return {
      totalDays,
      hoursDecimal: (totalSeconds / 3600).toFixed(2),
      pausesDecimal: (totalPauseSeconds / 3600).toFixed(2),
      netTimeFormatted: formatSeconds(totalSeconds)
    };
  }, [filteredShifts]);

  // --- RF-12: EXPORTS (CSV) ---
  const handleExportCSV = () => {
    if (filteredShifts.length === 0) {
      alert('No hay registros para exportar');
      return;
    }

    const headers = ['ID Registro', 'Colaborador', 'Fecha', 'Hora Entrada', 'Hora Salida', 'Pausas Realizadas', 'Tiempo Neto (Segundos)', 'Tiempo Neto (Formateado)'];
    const rows = filteredShifts.map(s => [
      s.id,
      s.usuario_nombre,
      s.fecha,
      formatTimeOnly(s.hora_entrada),
      s.hora_salida ? formatTimeOnly(s.hora_salida) : 'En progreso',
      s.pausas.length,
      s.tiempo_neto,
      formatSeconds(s.tiempo_neto)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_control_horario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RF-12: EXPORTS (Printable PDF) ---
  const handlePrintPDF = () => {
    window.print();
  };

  // --- RF-13: EDIT ACTION ---
  const openEditModal = (shift) => {
    setEditShift(shift);
    // Convert ISO to local-datetime-local format (YYYY-MM-DDTHH:MM)
    const toLocalDateTimeLocal = (isoStr) => {
      if (!isoStr) return '';
      const date = new Date(isoStr);
      // Adjust timezone offset to match input
      const tzOffset = date.getTimezoneOffset() * 60000; 
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    setEditEntrada(toLocalDateTimeLocal(shift.hora_entrada));
    setEditSalida(toLocalDateTimeLocal(shift.hora_salida));
    setEditPausas(shift.pausas.map(p => ({
      ...p,
      hora_inicio: toLocalDateTimeLocal(p.hora_inicio),
      hora_fin: toLocalDateTimeLocal(p.hora_fin)
    })));
    setMotivoEdicion('');
    setEditError('');
  };

  const handleAddPauseInEdit = () => {
    const activeReasons = motivosPausa.filter(m => m.activo);
    const reasonName = activeReasons.length > 0 ? activeReasons[0].nombre : 'Pausa Activa';
    
    setEditPausas([
      ...editPausas,
      {
        id: `p-edit-${Date.now()}`,
        motivo: reasonName,
        hora_inicio: '',
        hora_fin: ''
      }
    ]);
  };

  const handleRemovePauseInEdit = (id) => {
    setEditPausas(editPausas.filter(p => p.id !== id));
  };

  const handlePauseFieldChange = (id, field, value) => {
    setEditPausas(editPausas.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSaveEdit = () => {
    setEditError('');

    // Validations
    if (!editEntrada) {
      setEditError('La hora de entrada es obligatoria.');
      return;
    }

    const entradaTime = new Date(editEntrada).getTime();
    const salidaTime = editSalida ? new Date(editSalida).getTime() : null;

    if (salidaTime && salidaTime <= entradaTime) {
      setEditError('La hora de salida debe ser posterior a la hora de entrada.');
      return;
    }

    if (!motivoEdicion.trim()) {
      setEditError('Debes ingresar obligatoriamente una justificación para esta modificación manual.');
      return;
    }

    // Validate pause timestamps
    for (let p of editPausas) {
      if (!p.hora_inicio || !p.hora_fin) {
        setEditError('Todas las pausas registradas deben tener hora de inicio y fin.');
        return;
      }
      const pStart = new Date(p.hora_inicio).getTime();
      const pEnd = new Date(p.hora_fin).getTime();
      if (pEnd <= pStart) {
        setEditError('Las horas de término de pausa deben ser posteriores a su hora de inicio.');
        return;
      }
      if (pStart < entradaTime || (salidaTime && pEnd > salidaTime)) {
        setEditError('Los intervalos de pausa deben estar contenidos dentro del horario de la jornada.');
        return;
      }
    }

    // Format fields back to standard ISO
    const formattedEntrada = new Date(editEntrada).toISOString();
    const formattedSalida = editSalida ? new Date(editSalida).toISOString() : null;
    const formattedPausas = editPausas.map(p => ({
      id: p.id,
      motivo: p.motivo,
      hora_inicio: new Date(p.hora_inicio).toISOString(),
      hora_fin: new Date(p.hora_fin).toISOString()
    }));

    // Trigger edit action inside context
    editarRegistroManual(editShift.id, {
      hora_entrada: formattedEntrada,
      hora_salida: formattedSalida,
      pausas: formattedPausas,
      motivo_edicion: motivoEdicion.trim()
    });

    setEditShift(null);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full print:p-0 print:bg-white print:text-black">
      
      {/* Search and Filters card */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-6 print:hidden">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-bold text-white">Auditoría de Tiempos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Employee dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Filtrar Colaborador
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="todos">Todos los Empleados</option>
              {users.filter(u => u.rol === 'Empleado').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Rangos Predefinidos
            </label>
            <select
              value={filterPreset}
              onChange={(e) => {
                setFilterPreset(e.target.value);
                if (e.target.value !== 'personalizado') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="todos">Historial Completo</option>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Este Mes</option>
              <option value="personalizado">Rango Personalizado...</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              value={startDate}
              disabled={filterPreset !== 'personalizado'}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={endDate}
              disabled={filterPreset !== 'personalizado'}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Aggregate Report Summary for Payroll */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:border-b print:border-black print:rounded-none print:shadow-none print:p-4 print:bg-white print:text-black">
        <div>
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block print:text-black">Resumen del Reporte</span>
          <div className="text-xl font-bold text-white mt-1 print:text-black">
            Nómina Consolidada: {aggregates.hoursDecimal} Horas Laboradas
          </div>
          <p className="text-xs text-slate-400 mt-1 print:text-black">
            Cómputo sobre {aggregates.totalDays} jornadas registradas. Total descontado de pausas: {aggregates.pausesDecimal} hrs.
          </p>
        </div>

        {/* Actions buttons */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-dark-800 hover:bg-dark-750 border border-dark-700 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-brand-600/10"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* Main Shifts table */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl print:rounded-none print:border-none print:shadow-none print:p-0">
        <h4 className="text-sm font-bold text-white mb-4 print:text-black print:text-lg">Detalle General de Jornadas</h4>

        <div className="overflow-x-auto border border-dark-800 rounded-2xl print:border-collapse print:rounded-none print:border-t print:border-b print:border-black">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-850 text-slate-400 font-bold border-b border-dark-800 print:bg-slate-100 print:text-black print:border-black">
                <th className="p-4">Colaborador</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Entrada</th>
                <th className="p-4">Salida</th>
                <th className="p-4">Pausas</th>
                <th className="p-4">Tiempo Neto</th>
                <th className="p-4 text-right print:hidden">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 bg-dark-900/50 print:bg-white print:divide-y print:divide-slate-200">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 italic print:text-black">
                    No se encontraron registros en el sistema matching con los filtros.
                  </td>
                </tr>
              ) : (
                filteredShifts.map(s => (
                  <tr key={s.id} className="hover:bg-dark-850/30 transition-colors print:hover:bg-transparent">
                    <td className="p-4">
                      <div className="font-semibold text-white print:text-black">{s.usuario_nombre}</div>
                      <div className="text-[10px] text-slate-500 print:text-slate-500 mt-0.5">{s.usuario_email}</div>
                    </td>
                    <td className="p-4 text-slate-300 print:text-black">{formatDate(s.fecha, true)}</td>
                    <td className="p-4 font-mono font-semibold text-slate-300 print:text-black">
                      {formatTimeOnly(s.hora_entrada)}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-300 print:text-black">
                      {s.hora_salida ? formatTimeOnly(s.hora_salida) : 'En progreso'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-slate-300 print:text-black">
                        <Coffee className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        {s.pausas.length} pausas
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-brand-400 print:text-black">
                      {formatSeconds(s.tiempo_neto)}
                    </td>
                    <td className="p-4 text-right print:hidden">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 bg-dark-850 hover:bg-dark-750 border border-dark-850 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg transition-all"
                        title="Modificar registro"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RF-13 & RF-14: MANUAL EDIT REGISTRY MODAL --- */}
      {editShift && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn print:hidden">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Modificar Registro de Jornada</h3>
                <p className="text-xs text-slate-400 mt-1">Colaborador: {editShift.usuario_nombre}</p>
              </div>
              <button 
                onClick={() => setEditShift(null)}
                className="p-1.5 hover:bg-dark-800 rounded-xl text-slate-450 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Entrances and Exits Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Hora de Entrada (Entrada)
                  </label>
                  <input
                    type="datetime-local"
                    value={editEntrada}
                    onChange={(e) => setEditEntrada(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Hora de Salida (Salida)
                  </label>
                  <input
                    type="datetime-local"
                    value={editSalida}
                    onChange={(e) => setEditSalida(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pauses List Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Historial de Pausas</h5>
                  <button
                    onClick={handleAddPauseInEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 hover:text-brand-300 rounded-lg text-[10px] font-bold uppercase transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Pausa</span>
                  </button>
                </div>

                {editPausas.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-dark-850 rounded-xl border border-dark-800 text-center">
                    No hay pausas registradas para esta jornada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editPausas.map((pause, idx) => (
                      <div 
                        key={pause.id}
                        className="bg-dark-850 p-4 rounded-2xl border border-dark-800 space-y-3 relative"
                      >
                        <button
                          onClick={() => handleRemovePauseInEdit(pause.id)}
                          className="absolute top-4 right-4 p-1 hover:bg-red-500/10 text-slate-450 hover:text-red-400 rounded-lg transition-colors"
                          title="Eliminar pausa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                          {/* Motivo select */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Motivo
                            </label>
                            <select
                              value={pause.motivo}
                              onChange={(e) => handlePauseFieldChange(pause.id, 'motivo', e.target.value)}
                              className="w-full bg-dark-800 border border-dark-750 text-white rounded-lg px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
                            >
                              {motivosPausa.filter(m => m.activo).map(mot => (
                                <option key={mot.id} value={mot.nombre}>{mot.nombre}</option>
                              ))}
                            </select>
                          </div>
                          {/* Inicio */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Inicio Pausa
                            </label>
                            <input
                              type="datetime-local"
                              value={pause.hora_inicio}
                              onChange={(e) => handlePauseFieldChange(pause.id, 'hora_inicio', e.target.value)}
                              className="w-full bg-dark-800 border border-dark-750 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500"
                            />
                          </div>
                          {/* Fin */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Término Pausa
                            </label>
                            <input
                              type="datetime-local"
                              value={pause.hora_fin}
                              onChange={(e) => handlePauseFieldChange(pause.id, 'hora_fin', e.target.value)}
                              className="w-full bg-dark-800 border border-dark-750 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Justification input REQUIRED FOR RF-14 */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Justificación de la Modificación Manual (Obligatorio)
                </label>
                <textarea
                  value={motivoEdicion}
                  onChange={(e) => {
                    setMotivoEdicion(e.target.value);
                    setEditError('');
                  }}
                  rows="3"
                  placeholder="Explica el motivo técnico u omisión del empleado que justifica esta alteración de horas para la auditoría de nómina..."
                  className="w-full bg-dark-800 border border-dark-750 text-white rounded-2xl px-4 py-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-slate-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 border-t border-dark-800 pt-6">
                <button
                  onClick={() => setEditShift(null)}
                  className="flex-1 py-3 bg-dark-800 hover:bg-dark-750 hover:text-white border border-dark-700 text-slate-400 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/10 transition-all active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
