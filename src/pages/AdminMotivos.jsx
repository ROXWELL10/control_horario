import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';

export default function AdminMotivos() {
  const { 
    motivosPausa, 
    crearMotivoPausa, 
    actualizarMotivoPausa, 
    eliminarMotivoPausa 
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotivo, setEditingMotivo] = useState(null); // null if creating
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [errorText, setErrorText] = useState('');

  const openCreateModal = () => {
    setEditingMotivo(null);
    setNombre('');
    setActivo(true);
    setErrorText('');
    setModalOpen(true);
  };

  const openEditModal = (motivo) => {
    setEditingMotivo(motivo);
    setNombre(motivo.nombre);
    setActivo(motivo.activo);
    setErrorText('');
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorText('');

    if (!nombre.trim()) {
      setErrorText('El nombre del motivo es obligatorio.');
      return;
    }

    // Check duplication
    const duplicate = motivosPausa.find(m => 
      m.nombre.toLowerCase() === nombre.trim().toLowerCase() && 
      (!editingMotivo || m.id !== editingMotivo.id)
    );

    if (duplicate) {
      setErrorText('Ya existe un motivo registrado con este nombre.');
      return;
    }

    if (editingMotivo) {
      actualizarMotivoPausa(editingMotivo.id, nombre.trim(), activo);
    } else {
      crearMotivoPausa(nombre.trim());
    }

    setModalOpen(false);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner & Actions */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Catálogo de Motivos de Pausa</h3>
          <p className="text-xs text-slate-400 mt-1">
            Parámetros del catálogo de justificaciones exigidos obligatoriamente al personal al suspender su jornada.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-brand-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Motivo</span>
        </button>
      </div>

      {/* Motives list */}
      <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white mb-2">Motivos Registrados</h4>

        <div className="overflow-x-auto border border-dark-800 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-dark-850 text-slate-400 font-bold border-b border-dark-800">
                <th className="p-4">ID Motivo</th>
                <th className="p-4">Nombre Justificación</th>
                <th className="p-4">Estado en Fichaje</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 bg-dark-900/50">
              {motivosPausa.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500 italic">
                    No hay motivos de pausa parametrizados.
                  </td>
                </tr>
              ) : (
                motivosPausa.map(mot => (
                  <tr key={mot.id} className="hover:bg-dark-850/40 transition-colors">
                    <td className="p-4 font-mono text-slate-450">{mot.id}</td>
                    <td className="p-4 font-semibold text-white text-sm">{mot.nombre}</td>
                    <td className="p-4">
                      {mot.activo ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          Desactivado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(mot)}
                        className="p-1.5 bg-dark-850 hover:bg-dark-750 border border-dark-850 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg transition-all"
                        title="Editar motivo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el motivo "${mot.nombre}"?`)) {
                            eliminarMotivoPausa(mot.id);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                        title="Eliminar motivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CRUD MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-dark-900 border border-dark-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-dark-800 rounded-xl text-slate-450 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingMotivo ? 'Editar Motivo de Pausa' : 'Crear Motivo de Pausa'}
            </h3>

            {errorText && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nombre de la Justificación
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Trámite de Nómina o Lactancia"
                  className="w-full bg-dark-800 border border-dark-750 text-white rounded-xl px-4 py-3 text-xs focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              {/* Activo (only for edits) */}
              {editingMotivo && (
                <div className="flex items-center justify-between bg-dark-850 p-4 rounded-xl border border-dark-800">
                  <div>
                    <label className="block text-xs font-semibold text-white">
                      Motivo Habilitado
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Determina si aparece visible en el dropdown del empleado.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-5 h-5 rounded bg-dark-800 border-dark-750 text-brand-600 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-dark-800 hover:bg-dark-750 hover:text-white border border-dark-700 text-slate-400 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/10 transition-all active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
