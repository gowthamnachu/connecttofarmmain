import type { Order } from './api'

export function openPrintableShippingLabel(ord: Order) {
  const awb = ord.shipment?.awbNumber || `NP${Date.now().toString().slice(-8)}IN`
  const courier = ord.shipment?.courierName || 'NimbusPost Express'
  const recipient = ord.address?.receiverName || 'Valued Customer'
  const phone = ord.address?.receiverPhone || 'N/A'
  const fullAddress = `${ord.address?.line1 || ''}${ord.address?.line2 ? ', ' + ord.address.line2 : ''}, ${ord.address?.city || ''}, ${ord.address?.state || ''} - ${ord.address?.pincode || ''}`

  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shipping Label - ${awb}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; background: #f8fafc; color: #0f172a; }
        .label-card { max-width: 580px; margin: 0 auto; background: white; border: 2px solid #000; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
        .brand { font-size: 22px; font-weight: 900; color: #2D382C; letter-spacing: -0.5px; }
        .courier-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; background: #2D382C; color: white; padding: 4px 10px; border-radius: 4px; }
        .awb-section { text-align: center; border: 2px dashed #000; padding: 16px; margin: 16px 0; background: #fafafa; border-radius: 6px; }
        .awb-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .awb-code { font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #0f172a; }
        .barcode-sim { height: 44px; background: repeating-linear-gradient(90deg, #000 0, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px); margin: 10px auto 4px auto; max-width: 320px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .box { border: 1px solid #cbd5e1; padding: 12px 14px; border-radius: 6px; font-size: 12px; }
        .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
        .box-content { font-weight: 600; color: #0f172a; line-height: 1.5; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; font-weight: 600; }
        @media print { body { background: white; padding: 0; } .label-card { box-shadow: none; border: 2px solid #000; border-radius: 0; } }
      </style>
    </head>
    <body>
      <div class="label-card">
        <div class="header">
          <div class="brand">🌱 CONNECT TO FARM</div>
          <div class="courier-badge">${courier}</div>
        </div>
        <div class="awb-section">
          <div class="awb-title">NIMBUSPOST AIR WAYBILL (AWB)</div>
          <div class="awb-code">${awb}</div>
          <div class="barcode-sim"></div>
        </div>
        <div class="grid-2">
          <div class="box">
            <div class="box-title">SHIP FROM (ORIGIN)</div>
            <div class="box-content">
              <strong>Connect to Farm Fulfilment</strong><br/>
              LB Nagar, Hyderabad<br/>
              Telangana - 500074<br/>
              Ph: 9999999999
            </div>
          </div>
          <div class="box">
            <div class="box-title">SHIP TO (CONSIGNEE)</div>
            <div class="box-content">
              <strong>${recipient}</strong><br/>
              ${fullAddress}<br/>
              Ph: ${phone}
            </div>
          </div>
        </div>
        <div class="box" style="margin-bottom: 16px;">
          <div class="box-title">ORDER DETAILS</div>
          <div class="box-content">
            Order Ref: <strong>${ord.orderNumber}</strong> &nbsp;|&nbsp; Payment Status: <strong>${(ord.paymentStatus || 'PREPAID').toUpperCase()}</strong>
          </div>
        </div>
        <div class="footer">
          <span>Standard Surface Dispatch</span>
          <span>Thank you for shopping organic!</span>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}
