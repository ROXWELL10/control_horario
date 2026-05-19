import { enviarMensajeWhatsapp } from './envioWhatsapp';

const LOGIN_TIME_ZONE = 'America/Bogota';

const formatearHoraIngreso = (fecha = new Date()) => {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: LOGIN_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(fecha);
};

const crearMensajeIngreso = ({ usuario, metodoIngreso, fechaIngreso }) => {
  return [
    'Ingreso de usuario SAMMERS-JEANS',
    `Usuario: ${usuario.nombre || 'Sin nombre'}`,
    `Correo: ${usuario.email || 'Sin correo'}`,
    `Hora de ingreso: ${formatearHoraIngreso(fechaIngreso)}`,
    `Metodo de ingreso: ${metodoIngreso}`
  ].join('\n');
};

export const notificarIngresoEmpleado = async ({ usuario, usuarios = [], metodoIngreso }) => {
  if (!usuario || usuario.rol === 'Administrador') {
    return { ok: true, skipped: true, reason: 'admin_or_missing_user' };
  }

  const admins = usuarios.filter((item) => (
    item &&
    item.activo !== false &&
    item.rol === 'Administrador' &&
    item.telefono_whatsapp
  ));

  if (!admins.length) {
    return { ok: true, skipped: true, reason: 'missing_admin_phone' };
  }

  const message = crearMensajeIngreso({
    usuario,
    metodoIngreso,
    fechaIngreso: new Date()
  });

  const results = await Promise.all(
    admins.map((admin) => enviarMensajeWhatsapp({
      to: admin.telefono_whatsapp,
      message
    }))
  );

  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    return { ok: false, error: failed[0].error, results };
  }

  return { ok: true, results };
};
