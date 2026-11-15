import { BookingResponseDto } from "../../application/dtos/BookingDto";

/**
 * Plantillas de email HTML para Chivas Rumberas.
 * Mantener separadas de la lógica de envío para facilitar cambios de diseño.
 */

const DEFAULT_FRONTEND_URL = "https://chivas-rumberas-la80-ten.vercel.app";

export const getTrackingUrl = (bookingCode: string): string => {
  const envUrl = process.env.FRONTEND_URL?.trim().replace(/^["']+|["']+$/g, "");
  const baseUrl = (
    envUrl && !envUrl.includes("localhost") ? envUrl : DEFAULT_FRONTEND_URL
  ).replace(/\/+$/, "");
  return `${baseUrl}/seguimiento?code=${encodeURIComponent(bookingCode)}`;
};

export const bookingConfirmationTemplate = (booking: BookingResponseDto): string => {
  const trackingUrl = getTrackingUrl(booking.id);
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Reserva</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background-color: #D4A017; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .body { padding: 30px; color: #333333; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eeeeee; }
    .detail-label { font-weight: bold; color: #666666; }
    .detail-value { color: #333333; }
    .total { background-color: #FFF8E7; padding: 15px; border-radius: 6px; margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #D4A017; }
    .footer { background-color: #333333; padding: 20px; text-align: center; color: #aaaaaa; font-size: 12px; }
    .badge { display: inline-block; background-color: #D4A017; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .btn-track { display: inline-block; margin-top: 20px; background-color: #D4A017; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Tu chiva está reservada!</h1>
    </div>
    <div class="body">
      <p>Hola <strong>${booking.customerName}</strong>,</p>
      <p>Tu reserva ha sido recibida exitosamente. Aquí están los detalles:</p>

      <div class="detail-row">
        <span class="detail-label">Número de reserva</span>
        <span class="detail-value">#${booking.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Chiva</span>
        <span class="detail-value">${booking.chivaName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Recorrido</span>
        <span class="detail-value">${booking.travelName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fecha</span>
        <span class="detail-value">${booking.eventDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Horario</span>
        <span class="detail-value">${booking.startTime} – ${booking.endTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Invitados</span>
        <span class="detail-value">${booking.guestCount} personas</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Estado</span>
        <span class="detail-value"><span class="badge">Pendiente de confirmación</span></span>
      </div>

      <div class="total">
        Precio en revisión por el administrador
      </div>

      <p style="margin-top: 20px;">
        Puedes consultar el estado de tu reserva en cualquier momento aquí:<br />
        <a class="btn-track" href="${trackingUrl}">${trackingUrl}</a>
      </p>

      <p style="margin-top: 24px; color: #666666; font-size: 14px;">
        Nos pondremos en contacto contigo pronto para confirmar el valor final de tu reserva y coordinar el pago.
        Si tienes alguna pregunta, responde a este correo.
      </p>
    </div>
    <div class="footer">
      <p>Chivas Rumberas © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
`;
};

export const bookingStatusUpdateTemplate = ( booking: BookingResponseDto, previousStatus: string ): string => {
  const statusLabels: Record<string, string> = {
    confirmed: "✅ Confirmada",
    cancelled: "❌ Cancelada",
    completed: "🏁 Completada",
    pending: "⏳ Pendiente",
  };

  const statusColors: Record<string, string> = {
    confirmed: "#28a745",
    cancelled: "#dc3545",
    completed: "#6c757d",
    pending: "#D4A017",
  };

  const color = statusColors[booking.status] ?? "#333333";
  const label = statusLabels[booking.status] ?? booking.status;
  const trackingUrl = getTrackingUrl(booking.id);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Actualización de tu reserva</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background-color: ${color}; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
    .body { padding: 30px; color: #333333; }
    .footer { background-color: #333333; padding: 20px; text-align: center; color: #aaaaaa; font-size: 12px; }
    .btn-track { display: inline-block; margin-top: 16px; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${label}</h1>
    </div>
    <div class="body">
      <p>Hola <strong>${booking.customerName}</strong>,</p>
      <p>El estado de tu reserva <strong>#${booking.id.slice(0, 8).toUpperCase()}</strong> 
         ha cambiado de <em>${previousStatus}</em> a <strong>${booking.status}</strong>.</p>
      <p>Fecha: <strong>${booking.eventDate}</strong> | Horario: <strong>${booking.startTime} – ${booking.endTime}</strong></p>
      ${booking.status === "confirmed"
        ? `<div style="background-color: #FFF8E7; padding: 15px; border-radius: 6px; margin: 16px 0; text-align: right; font-size: 18px; font-weight: bold; color: #D4A017;">
             Total confirmado: $${booking.totalPrice.toLocaleString("es-CO")} COP
           </div>
           <p>🎉 ¡Tu chiva está confirmada! Estamos listos para hacer de tu evento algo inolvidable.</p>`
        : ""}
      ${booking.status === "cancelled"
        ? "<p>Si crees que esto fue un error, por favor contáctanos respondiendo este correo.</p>"
        : ""}
      <p style="margin-top: 20px;">
        Consulta los detalles y el seguimiento de tu reserva en:<br />
        <a class="btn-track" href="${trackingUrl}">${trackingUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>Chivas Rumberas © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
`;
};
