import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Menu, Shield } from 'lucide-react';

export default function Header({ currentTab }) {
  const { currentUser } = useApp();

  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'resumen':
        return { parent: 'Empleado', child: 'Control de jornada' };
      case 'historial':
        return { parent: 'Empleado', child: 'Historial de asistencia' };
      case 'admin-dashboard':
        return { parent: 'Administrador', child: 'Tablero en tiempo real' };
      case 'admin-historial':
        return { parent: 'Administrador', child: 'Auditoría e historiales' };
      case 'admin-usuarios':
        return { parent: 'Administrador', child: 'Gestión de usuarios' };
      case 'admin-motivos':
        return { parent: 'Administrador', child: 'Catálogo de motivos de pausa' };
      case 'admin-auditoria':
        return { parent: 'Administrador', child: 'Log de cambios de auditoría' };
      default:
        return { parent: 'Panel', child: 'Control Horario' };
    }
  };

  const { parent, child } = getBreadcrumbs();

  return (
    <header className="h-20 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-8 text-slate-300">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 hover:bg-dark-850 rounded-lg text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-sm">{parent}</span>
          <span className="text-slate-650 text-sm">/</span>
          <span className="text-white font-semibold text-sm">{child}</span>
          {currentUser.rol === 'Administrador' && (
            <span className="ml-3 flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Shield className="w-3 h-3" />
              Acceso Admin
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button 
          onClick={() => alert('No hay nuevas notificaciones')}
          className="relative p-2.5 bg-dark-800 hover:bg-dark-700/80 hover:text-white rounded-xl transition-all duration-200 border border-dark-700/20 group"
        >
          <Bell className="w-5 h-5 group-hover:scale-105 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-dark-900 animate-pulse" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{currentUser.nombre}</div>
            <div className="text-[10px] text-slate-400">{currentUser.cargo || currentUser.rol}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 transition-colors flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer select-none">
            {currentUser.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
