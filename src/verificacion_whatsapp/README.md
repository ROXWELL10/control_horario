# verificacion_whatsapp

Modulo del registro para validar el celular por WhatsApp antes de crear el usuario.

Variables opcionales:

- `VITE_SERVITES_WHATSAPP_SEND_URL`: endpoint completo de envio, por ejemplo `/api/whatsapp/send`.
- `VITE_SERVITES_WHATSAPP_API_URL`: base del bot; el modulo agrega `/send` automaticamente.

El bot Servites debe aceptar:

```json
{
  "to": "573001234567",
  "message": "texto del codigo OTP"
}
```

Si no hay endpoint configurado, usa OTP simulado en el navegador para desarrollo local.

El mismo envio se reutiliza para avisar al administrador cuando un empleado inicia sesion.
