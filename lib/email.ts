import nodemailer from "nodemailer"

// ─── Transporter ──────────────────────────────────────────────────────────────
// Configure via env vars. Supports Gmail, SMTP, Resend (SMTP relay), etc.
// For Gmail: EMAIL_HOST=smtp.gmail.com, EMAIL_USER=you@gmail.com, EMAIL_PASS=app_password
// For Resend: EMAIL_HOST=smtp.resend.com, EMAIL_USER=resend, EMAIL_PASS=re_xxx, EMAIL_PORT=465
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

const FROM = `"TRIDENT" <${process.env.EMAIL_USER || "noreply@trident.store"}>`

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem { name: string; qty: number; price: number; size?: string }
interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  totalAmount: number
  shippingAddress: string
  status?: string
  trackingNumber?: string
}

// ─── HTML Templates ───────────────────────────────────────────────────────────
function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#050505;border:1px solid #1e1e1e;border-bottom:3px solid #e5202e;padding:28px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;letter-spacing:8px;color:#f5f5f5;font-family:Arial Black,sans-serif;">
              TRI<span style="color:#e5202e;">DENT</span>
            </div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#0d0d0d;border:1px solid #1e1e1e;border-top:none;padding:40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;border:1px solid #1e1e1e;border-top:none;background:#050505;">
            <p style="color:#333;font-size:12px;margin:0 0 8px;">
              © ${new Date().getFullYear()} TRIDENT. All rights reserved.
            </p>
            <p style="color:#222;font-size:11px;margin:0;">
              If you have any questions, reply to this email or contact support@trident.store
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function itemsTable(items: OrderItem[]) {
  return items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#f5f5f5;font-size:14px;">
        ${i.name}${i.size ? ` <span style="color:#666;">(${i.size})</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#666;font-size:13px;text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;color:#f5f5f5;font-size:14px;font-weight:700;text-align:right;">$${(i.price * i.qty).toFixed(2)}</td>
    </tr>`).join("")
}

// ─── 1. Order Confirmation ─────────────────────────────────────────────────────
export async function sendOrderConfirmation(data: OrderEmailData) {
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:2px;color:#f5f5f5;margin:0 0 8px;">ORDER CONFIRMED</h1>
    <p style="color:#666;font-size:14px;margin:0 0 28px;">Hey ${data.customerName}, thank you for your order!</p>

    <div style="background:#0a0a0a;border:1px solid #1e1e1e;padding:16px 20px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Order ID</td>
          <td style="color:#e5202e;font-size:15px;font-weight:900;letter-spacing:2px;text-align:right;">${data.orderId}</td>
        </tr>
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding-bottom:10px;">Item</td>
        <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding-bottom:10px;text-align:center;">Qty</td>
        <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding-bottom:10px;text-align:right;">Price</td>
      </tr>
      ${itemsTable(data.items)}
      <tr>
        <td colspan="2" style="padding:16px 0 0;color:#f5f5f5;font-size:15px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">Total</td>
        <td style="padding:16px 0 0;color:#e5202e;font-size:18px;font-weight:900;text-align:right;">$${data.totalAmount.toFixed(2)}</td>
      </tr>
    </table>

    <div style="background:#0a0a0a;border:1px solid #1e1e1e;padding:16px 20px;margin-bottom:28px;">
      <div style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Shipping to</div>
      <div style="color:#888;font-size:14px;line-height:1.6;">${data.shippingAddress}</div>
    </div>

    <p style="color:#555;font-size:13px;line-height:1.7;margin:0;">
      We'll send you another email when your order ships with a tracking number.<br/>
      Estimated delivery: <strong style="color:#f5f5f5;">3–7 business days</strong>.
    </p>

    <div style="margin-top:28px;text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders"
        style="display:inline-block;background:#e5202e;color:#fff;padding:14px 32px;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
        TRACK ORDER
      </a>
    </div>`

  return sendMail(data.customerEmail, `Order Confirmed — ${data.orderId}`, body)
}

// ─── 2. Order Shipped ─────────────────────────────────────────────────────────
export async function sendOrderShipped(data: OrderEmailData) {
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:2px;color:#f5f5f5;margin:0 0 8px;">YOUR ORDER IS ON ITS WAY</h1>
    <p style="color:#666;font-size:14px;margin:0 0 28px;">Hey ${data.customerName}, your order has been shipped!</p>

    <div style="background:#0a0a0a;border:1px solid #1e1e1e;padding:16px 20px;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Order ID</td>
          <td style="color:#e5202e;font-size:15px;font-weight:900;letter-spacing:2px;text-align:right;">${data.orderId}</td>
        </tr>
        ${data.trackingNumber ? `<tr>
          <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding-top:10px;">Tracking #</td>
          <td style="color:#f5f5f5;font-size:15px;font-weight:900;text-align:right;padding-top:10px;">${data.trackingNumber}</td>
        </tr>` : ""}
      </table>
    </div>

    <p style="color:#555;font-size:13px;line-height:1.7;margin:0 0 28px;">
      Your package is on its way! Expected delivery in <strong style="color:#f5f5f5;">2–5 business days</strong>.
    </p>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders"
        style="display:inline-block;background:#e5202e;color:#fff;padding:14px 32px;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
        TRACK ORDER
      </a>
    </div>`

  return sendMail(data.customerEmail, `Your order ${data.orderId} has shipped!`, body)
}

// ─── 3. Order Delivered ───────────────────────────────────────────────────────
export async function sendOrderDelivered(data: OrderEmailData) {
  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:2px;color:#f5f5f5;margin:0 0 8px;">ORDER DELIVERED</h1>
    <p style="color:#666;font-size:14px;margin:0 0 28px;">Hey ${data.customerName}, your order has been delivered!</p>

    <div style="background:#0a0a0a;border:1px solid #1e1e1e;padding:16px 20px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Order ID</td>
          <td style="color:#e5202e;font-size:15px;font-weight:900;letter-spacing:2px;text-align:right;">${data.orderId}</td>
        </tr>
      </table>
    </div>

    <p style="color:#555;font-size:13px;line-height:1.7;margin:0 0 28px;">
      We hope you love your new TRIDENT gear. Leave a review and help others find their perfect fit!
    </p>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}"
        style="display:inline-block;background:#e5202e;color:#fff;padding:14px 32px;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
        SHOP AGAIN
      </a>
    </div>`

  return sendMail(data.customerEmail, `Order ${data.orderId} delivered — How did we do?`, body)
}

// ─── 4. Status Update Generic ─────────────────────────────────────────────────
export async function sendStatusUpdate(data: OrderEmailData) {
  const statusLabel: Record<string, string> = {
    processing: "BEING PROCESSED",
    shipped:    "SHIPPED",
    delivered:  "DELIVERED",
    cancelled:  "CANCELLED",
  }
  const label = statusLabel[data.status || ""] || (data.status || "").toUpperCase()

  if (data.status === "shipped")   return sendOrderShipped(data)
  if (data.status === "delivered") return sendOrderDelivered(data)

  const body = `
    <h1 style="font-size:22px;font-weight:900;letter-spacing:2px;color:#f5f5f5;margin:0 0 8px;">ORDER UPDATE</h1>
    <p style="color:#666;font-size:14px;margin:0 0 28px;">Hey ${data.customerName}, your order status has been updated.</p>

    <div style="background:#0a0a0a;border:1px solid #1e1e1e;padding:16px 20px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Order ID</td>
          <td style="color:#e5202e;font-size:15px;font-weight:900;letter-spacing:2px;text-align:right;">${data.orderId}</td>
        </tr>
        <tr>
          <td style="color:#444;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding-top:10px;">Status</td>
          <td style="color:#f5f5f5;font-size:15px;font-weight:900;text-align:right;padding-top:10px;">${label}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders"
        style="display:inline-block;background:#e5202e;color:#fff;padding:14px 32px;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">
        VIEW ORDER
      </a>
    </div>`

  return sendMail(data.customerEmail, `Order ${data.orderId} — Status: ${label}`, body)
}

// ─── Internal send helper ──────────────────────────────────────────────────────
async function sendMail(to: string, subject: string, htmlBody: string) {
  const html = baseTemplate(subject, htmlBody)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL] Would send to ${to}: "${subject}" (no EMAIL_USER/EMAIL_PASS set)`)
    return { success: true, dev: true }
  }
  try {
    const transporter = getTransporter()
    await transporter.sendMail({ from: FROM, to, subject, html })
    return { success: true }
  } catch (e) {
    console.error("[EMAIL]", e)
    return { success: false, error: String(e) }
  }
}
