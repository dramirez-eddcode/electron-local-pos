// Servicio de impresión migrado con tipos TypeScript
// Mantiene la funcionalidad existente con mejoras

export interface TicketData {
  storeName?: string;
  storeAddress?: string;
  ticketNumber?: string;
  items: TicketItem[];
  total: number;
  date?: string;
  // Nuevos campos para el sistema completo
  subtotal?: number;
  iva?: number;
  tipoPago?: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  montoRecibido?: number;
  cambio?: number;
  datosTarjeta?: {
    tipo: string;
    ultimosDigitos: string;
    autorizacion: string;
  };
  usuario?: string;
  sucursal?: string;
  folio?: string;
}

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  total?: number;
  fechaCaducidad?: string;
}

// Comandos ESC/POS para abrir cajón de dinero
export const createCashDrawerCommand = (): Buffer => {
  // ESC/POS command para abrir cajón: ESC p m t1 t2
  // ESC = 0x1B, p = 0x70, m = 0x00 (pin 2), t1 = 0x19 (25*2ms = 50ms), t2 = 0xFA (250*2ms = 500ms)
  const command = Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]);
  return command;
};

export const createTicketHTML = (ticketData: TicketData): string => {
  const { 
    storeName = \"FARMACIAS MS\", 
    storeAddress = \"Dirección de la farmacia\", 
    ticketNumber = Date.now().toString().slice(-6),
    items = [],
    total = 0,
    subtotal,
    iva,
    tipoPago,
    montoRecibido,
    cambio,
    datosTarjeta,
    usuario,
    sucursal,
    folio,
    date = new Date().toLocaleString('es-ES')
  } = ticketData;

  const itemsHTML = items.map(item => {
    const itemTotal = item.total || (item.quantity * item.price);
    return `
    <tr>
      <td style=\"text-align: left; padding: 2px 0;\">${item.name}</td>
      <td style=\"text-align: center; padding: 2px 0;\">${item.quantity}</td>
      <td style=\"text-align: right; padding: 2px 0;\">$${item.price.toFixed(2)}</td>
      <td style=\"text-align: right; padding: 2px 0;\">$${itemTotal.toFixed(2)}</td>
    </tr>
    ${item.fechaCaducidad ? `<tr><td colspan=\"4\" style=\"font-size: 8px; color: #666; text-align: left;\">Cad: ${item.fechaCaducidad}</td></tr>` : ''}
  `;
  }).join('');

  // Información de pago
  let pagoHTML = '';
  if (tipoPago) {
    pagoHTML = `
      <div class=\"payment-info\">
        <div class=\"payment-method\">Tipo de Pago: ${tipoPago}</div>
        ${montoRecibido ? `<div>Recibido: $${montoRecibido.toFixed(2)}</div>` : ''}
        ${cambio ? `<div>Cambio: $${cambio.toFixed(2)}</div>` : ''}
        ${datosTarjeta ? `
          <div class=\"card-info\">
            <div>Tarjeta ${datosTarjeta.tipo}</div>
            <div>****${datosTarjeta.ultimosDigitos}</div>
            <div>Autorización: ${datosTarjeta.autorizacion}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset=\"utf-8\">
      <title>Ticket #${folio || ticketNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 58mm;
          background: white;
        }
        .ticket {
          text-align: center;
        }
        .header {
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .store-name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .store-address {
          font-size: 10px;
          margin-bottom: 4px;
        }
        .ticket-info {
          text-align: left;
          margin: 8px 0;
        }
        .items-table {
          width: 100%;
          font-size: 10px;
          margin: 8px 0;
        }
        .items-header {
          border-bottom: 1px solid #000;
          font-weight: bold;
        }
        .total-section {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
          text-align: right;
        }
        .total {
          font-weight: bold;
          font-size: 14px;
        }
        .payment-info {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
          text-align: left;
          font-size: 10px;
        }
        .payment-method {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .card-info {
          margin-top: 4px;
          font-size: 9px;
        }
        .footer {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 12px;
          text-align: center;
          font-size: 10px;
        }
        .user-info {
          text-align: left;
          font-size: 9px;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class=\"ticket\">
        <div class=\"header\">
          <div class=\"store-name\">${storeName}</div>
          <div class=\"store-address\">${storeAddress}</div>
        </div>
        
        <div class=\"ticket-info\">
          <div>Ticket: #${folio || ticketNumber}</div>
          <div>Fecha: ${date}</div>
          ${usuario ? `<div>Cajero: ${usuario}</div>` : ''}
          ${sucursal ? `<div>Sucursal: ${sucursal}</div>` : ''}
        </div>
        
        <table class=\"items-table\">
          <tr class=\"items-header\">
            <td style=\"text-align: left; padding: 4px 0;\">Artículo</td>
            <td style=\"text-align: center; padding: 4px 0;\">Cant.</td>
            <td style=\"text-align: right; padding: 4px 0;\">Precio</td>
            <td style=\"text-align: right; padding: 4px 0;\">Total</td>
          </tr>
          ${itemsHTML}
        </table>
        
        <div class=\"total-section\">
          ${subtotal ? `<div>Subtotal: $${subtotal.toFixed(2)}</div>` : ''}
          ${iva ? `<div>IVA: $${iva.toFixed(2)}</div>` : ''}
          <div class=\"total\">TOTAL: $${total.toFixed(2)}</div>
        </div>
        
        ${pagoHTML}
        
        <div class=\"footer\">
          <div>¡Gracias por su compra!</div>
          <div>Sistema POS Farmacias MS</div>
          <div>RFC: [Configurar RFC]</div>
        </div>
      </div>
    </body>
    </html>
  `;
};