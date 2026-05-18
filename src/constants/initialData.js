export const DEFAULT_USERS = [
  {
    id: 'u-1',
    nombre: 'Carlos Pérez',
    email: 'carlos.perez@sammersjeans.com',
    rol: 'Empleado',
    avatar: 'CP',
    cargo: 'Operario de Confección',
    activo: true
  },
  {
    id: 'u-2',
    nombre: 'Laura Gómez',
    email: 'laura.gomez@sammersjeans.com',
    rol: 'Administrador',
    avatar: 'LG',
    cargo: 'Directora de Operaciones / RRHH',
    activo: true
  },
  {
    id: 'u-3',
    nombre: 'Juan Torres',
    email: 'juan.torres@sammersjeans.com',
    rol: 'Empleado',
    avatar: 'JT',
    cargo: 'Auxiliar de Logística',
    activo: true
  },
  {
    id: 'u-4',
    nombre: 'Valeria Restrepo',
    email: 'valeria.restrepo@sammersjeans.com',
    rol: 'Empleado',
    avatar: 'VR',
    cargo: 'Diseñadora de Moda',
    activo: false
  }
];

export const DEFAULT_MOTIVOS_PAUSA = [
  { id: 'm-1', nombre: 'Almuerzo', activo: true },
  { id: 'm-2', nombre: 'Pausa Activa / Break', activo: true },
  { id: 'm-3', nombre: 'Asunto Médico', activo: true },
  { id: 'm-4', nombre: 'Diligencia Personal', activo: true },
  { id: 'm-5', nombre: 'Capacitación', activo: true }
];

export const DEFAULT_ANUNCIOS = [
  {
    id: 'a-1',
    titulo: 'Nuevo diseño disponible',
    descripcion: 'Interfaz mejorada en el sistema de registro.',
    color: 'blue'
  },
  {
    id: 'a-2',
    titulo: 'Proceso operativo actualizado',
    descripcion: 'Cambios en el flujo de confección de jeans baggy.',
    color: 'yellow'
  },
  {
    id: 'a-3',
    titulo: 'Entrega de equipos de seguridad',
    descripcion: 'Equipo disponible para recolección en almacén.',
    color: 'green'
  }
];

// Generates some mock shifts for the last 5 days
export const getMockShifts = () => {
  const shifts = [];
  const users = ['u-1', 'u-3'];
  const today = new Date();
  
  users.forEach(userId => {
    for (let i = 1; i <= 5; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const dateString = date.toISOString().split('T')[0];
      
      // Shift standard hours
      const entryTime = new Date(`${dateString}T08:00:00`);
      const exitTime = new Date(`${dateString}T17:00:00`);
      
      // Pause
      const pauseStart = new Date(`${dateString}T12:00:00`);
      const pauseEnd = new Date(`${dateString}T13:00:00`);
      
      const pausas = [
        {
          id: `p-${userId}-${i}-1`,
          motivo: 'Almuerzo',
          hora_inicio: pauseStart.toISOString(),
          hora_fin: pauseEnd.toISOString()
        }
      ];
      
      // Calculate net hours (9 hours gross - 1 hour pause = 8 hours net = 28800 seconds)
      shifts.push({
        id: `s-${userId}-${i}`,
        usuario_id: userId,
        fecha: dateString,
        hora_entrada: entryTime.toISOString(),
        hora_salida: exitTime.toISOString(),
        estado: 'finalizado',
        pausas: pausas,
        tiempo_neto: 28800 // 8 hours in seconds
      });
    }
  });
  
  return shifts;
};

export const DEFAULT_AUDITORIA_LOGS = [
  {
    id: 'log-1',
    admin_id: 'u-2',
    admin_nombre: 'Laura Gómez',
    usuario_nombre: 'Carlos Pérez',
    jornada_id: 's-u-1-1',
    campo_modificado: 'Hora Salida',
    valor_anterior: '17:00:00',
    valor_nuevo: '17:30:00',
    motivo_edicion: 'Empleado olvidó registrar la salida al quedarse tiempo extra.',
    fecha_cambio: new Date(Date.now() - 3600000 * 24).toISOString() // Yesterday
  }
];
