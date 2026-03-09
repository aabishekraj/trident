# TRIDENT — Technical Architecture & Production Support Guide

> Version: 1.0 | Stack: Next.js 16 · React 19 · MongoDB · Stripe · Nodemailer

---

## 1. Project Overview

TRIDENT is a full-stack premium e-commerce storefront built on Next.js 16 App Router. It covers the complete customer journey — browse → sign-in → cart → checkout → order tracking — plus a role-gated admin console for product/order/user management.

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19 |
| Language | TypeScript | 5 |
| Database | MongoDB via Mongoose | 9.x |
| Payments | Stripe Checkout (hosted) | 20.x |
| Email | Nodemailer (SMTP/Gmail) | 7.x |
| Auth — Admin | httpOnly cookie (base64 JSON) | custom |
| Auth — Customer | Email OTP (in-memory store) | custom |
| Styles | Inline CSS + Tailwind CSS | 4 |
| Fonts | Bebas Neue, Barlow, Barlow Condensed | Google Fonts |
| Proxy/Middleware | proxy.ts (Next.js 16 convention) | — |

---

## 3. High-Level Architecture

```
Browser
  │
  ├─ Public Store (Next.js App Router)
  │     ├─ Homepage            /
  │     ├─ Collections         /collection/[gender]
  │     ├─ Product Detail      /product/[id]
  │     ├─ Sign In / OTP       /signin
  │     ├─ Checkout            /checkout
  │     ├─ Order Success       /success
  │     ├─ Order Tracking      /track
  │     └─ Account             /account, /account/orders, /account/wishlist
  │
  ├─ Admin Console (role-protected via proxy.ts cookie check)
  │     ├─ Login               /admin/login
  │     ├─ Dashboard           /admin
  │     ├─ Orders              /admin/orders
  │     ├─ Products            /admin/products
  │     ├─ Coupons             /admin/coupons
  │     ├─ Analytics           /admin/analytics
  │     └─ Users               /admin/users
  │
  └─ API Routes (Next.js Route Handlers)
        ├─ /api/products         CRUD products
        ├─ /api/products/bulk    CSV bulk import
        ├─ /api/orders           CRUD orders
        ├─ /api/track            Public order tracking
        ├─ /api/checkout         Create Stripe session
        ├─ /api/webhooks/stripe  Stripe payment confirmation
        ├─ /api/auth/customer    Email OTP auth
        ├─ /api/admin/login      Admin session (cookie)
        ├─ /api/admin/users      Admin user management
        ├─ /api/analytics        Revenue/order stats
        ├─ /api/coupons          Coupon CRUD + validation
        └─ /api/upload           Product image upload

External Services
  ├─ MongoDB Atlas (or local) — data persistence
  ├─ Stripe — payment processing + webhooks
  └─ SMTP (Gmail/Resend) — transactional emails
```

---

## 4. Request Flow Diagrams

### 4.1 Customer OTP Sign-In

```
Customer enters email
  → POST /api/auth/customer { action: "sendOtp", email }
  → Server generates 6-digit OTP
  → Stores in otpStore Map (in-memory, 10 min TTL)
  → Sends HTML email via Nodemailer
  → Returns { success: true } — OTP never in response

Customer enters OTP
  → POST /api/auth/customer { action: "verifyOtp", email, otp }
  → Server checks otpStore[email]
  → If valid: clears OTP, returns { name, email, token }
  → Client saves to localStorage("trident_customer")
```

### 4.2 Stripe Payment Flow

```
Customer clicks Pay (card)
  → POST /api/checkout { cart, customer, shippingAddress }
  → Server creates Order in MongoDB (status: pending, paymentStatus: pending)
  → Server creates Stripe Checkout Session
  → Returns { url, orderId }
  → Browser redirects to Stripe hosted checkout

Stripe payment completes
  → Stripe fires POST to /api/webhooks/stripe
  → Event: checkout.session.completed
  → Server updates Order (status: processing, paymentStatus: paid)
  → Sends order confirmation email
  → Stripe redirects browser to /success?orderId=TRD-...

Stripe payment expires/fails
  → Event: checkout.session.expired
  → Server marks Order status: cancelled / paymentStatus: failed
```

### 4.3 COD / UPI Order Flow

```
Customer clicks Place Order (COD or UPI)
  → POST /api/orders { customer, items, totalAmount, paymentMethod }
  → Server creates Order in MongoDB
  → Sends confirmation email
  → Returns { success: true, data: { orderId } }
  → Checkout page shows confirmation screen with orderId
  → TRACK ORDER button → /track?id=<orderId>
```

### 4.4 Admin Login Flow

```
Admin enters credentials
  → POST /api/admin/login { username, password }
  → Server checks env-var credentials first (no DB needed)
    If match: create base64 JSON session token
              set httpOnly cookie "trident_admin_session"
              return { success: true }
  → If no match: try DB AdminUser (4s timeout)
  → Client receives success
  → window.location.href = "/admin" (hard navigation)
  → proxy.ts intercepts /admin/* request
  → Decodes cookie, checks for valid { username } field
  → Allows through → Admin layout fetches session for role info
```

---

## 5. File Structure & Feature Map

### 5.1 Pages (Frontend)

| File | Route | Feature |
|---|---|---|
| `app/layout.tsx` | All routes | Root layout — wraps all pages in **CartProvider** and Google Fonts |
| `app/page.tsx` | `/` | Homepage — hero, NAV_ITEMS with dropdowns, product grid, account dropdown |
| `app/signin/page.tsx` | `/signin` | Email OTP authentication — send OTP, verify OTP, no demo codes |
| `app/checkout/page.tsx` | `/checkout` | Multi-step checkout — shipping details, payment method (card/UPI/COD), order summary |
| `app/success/page.tsx` | `/success?orderId=` | Post-Stripe payment confirmation — shows orderId, TRACK ORDER → `/track?id=` |
| `app/track/page.tsx` | `/track?id=` | **Public** order tracking — enter order ID + optional email, progress bar, item list |
| `app/product/[id]/page.tsx` | `/product/:id` | Product detail — image, size selector, Add to Cart (uses CartProvider) |
| `app/collection/[gender]/page.tsx` | `/collection/:gender` | Category page — Men / Women / Kids / Unisex hero + product grid |
| `app/collection/[gender]/[subcategory]/page.tsx` | `/collection/:gender/:sub` | Sub-category filter page |
| `app/account/page.tsx` | `/account` | Customer account — profile, quick links to orders/wishlist |
| `app/account/orders/page.tsx` | `/account/orders` | Full order history — fetches orders by customer email, animated progress tracker |
| `app/account/wishlist/page.tsx` | `/account/wishlist` | Wishlist — reads from `localStorage("trident_wishlist")` |

### 5.2 Admin Pages

| File | Route | Role Access |
|---|---|---|
| `app/admin/login/page.tsx` | `/admin/login` | Public |
| `app/admin/layout.tsx` | `/admin/*` | All roles — filters nav + enforces page-level RBAC |
| `app/admin/page.tsx` | `/admin` | All roles — KPI cards, recent orders, quick actions |
| `app/admin/orders/page.tsx` | `/admin/orders` | All roles (analyst: view only) |
| `app/admin/products/page.tsx` | `/admin/products` | All roles (analyst/order_manager: view only) |
| `app/admin/coupons/page.tsx` | `/admin/coupons` | All roles (analyst/order_manager: view only) |
| `app/admin/analytics/page.tsx` | `/admin/analytics` | superadmin, manager, analyst |
| `app/admin/users/page.tsx` | `/admin/users` | superadmin (view), manager (view only) |

### 5.3 API Routes

| File | Method + Path | What it does |
|---|---|---|
| `app/api/products/route.ts` | GET `/api/products` | List all products from MongoDB |
| `app/api/products/route.ts` | POST `/api/products` | Create product |
| `app/api/products/[id]/route.ts` | PUT/DELETE `/api/products/:id` | Update / delete product |
| `app/api/products/bulk/route.ts` | POST `/api/products/bulk` | Bulk create products (CSV import) |
| `app/api/orders/route.ts` | GET `/api/orders` | List orders — supports ?email=, ?status=, ?search= filters |
| `app/api/orders/route.ts` | POST `/api/orders` | Create order (COD/UPI path) |
| `app/api/orders/[id]/route.ts` | GET/PUT/DELETE `/api/orders/:id` | Single order — admin status updates |
| `app/api/track/route.ts` | GET `/api/track?orderId=` | **Public** tracking — returns masked order data (no login needed) |
| `app/api/checkout/route.ts` | POST `/api/checkout` | Pre-create order → create Stripe session → return redirect URL |
| `app/api/webhooks/stripe/route.ts` | POST `/api/webhooks/stripe` | Stripe event handler — marks order paid/failed, sends email |
| `app/api/auth/customer/route.ts` | POST `/api/auth/customer` | OTP: sendOtp action generates+emails code; verifyOtp action validates |
| `app/api/admin/login/route.ts` | POST `/api/admin/login` | Admin login — env-var check then DB fallback; sets httpOnly cookie |
| `app/api/admin/login/route.ts` | GET `/api/admin/login` | Returns current admin session info (used by layout for RBAC) |
| `app/api/admin/login/route.ts` | DELETE `/api/admin/login` | Admin logout — clears cookie |
| `app/api/admin/users/route.ts` | GET `/api/admin/users` | List all admin users |
| `app/api/admin/users/route.ts` | POST `/api/admin/users` | Create admin user |
| `app/api/admin/users/[id]/route.ts` | PUT `/api/admin/users/:id` | Change role / enable / disable user |
| `app/api/admin/users/[id]/route.ts` | DELETE `/api/admin/users/:id` | Delete admin user |
| `app/api/analytics/route.ts` | GET `/api/analytics` | Aggregated revenue, order counts, top products (MongoDB aggregations) |
| `app/api/coupons/route.ts` | GET/POST `/api/coupons` | List / create coupons |
| `app/api/coupons/[id]/route.ts` | PUT/DELETE `/api/coupons/:id` | Update / delete coupon |
| `app/api/coupons/validate/route.ts` | POST `/api/coupons/validate` | Validate coupon code, return discount % |
| `app/api/upload/route.ts` | POST `/api/upload` | Product image upload (base64 → stored in DB) |

### 5.4 Models (MongoDB / Mongoose)

| File | Collection | Key Fields |
|---|---|---|
| `models/Order.ts` | `orders` | `orderId` (TRD-YYYYMMDD-XXXXXX), `customer`, `items[]`, `totalAmount`, `status`, `paymentStatus`, `paymentMethod`, `stripeSessionId`, `trackingNumber` |
| `models/Product.ts` | `products` | `name`, `price`, `image`, `category`, `gender`, `stock`, `description` |
| `models/AdminUser.ts` | `adminusers` | `username`, `email`, `password` (SHA-256+salt), `role`, `active`, `lastLogin` |
| `models/Coupon.ts` | `coupons` | `code`, `discount`, `type` (percent/fixed), `maxUses`, `usedCount`, `expiresAt` |

### 5.5 Libraries & Utilities

| File | Purpose |
|---|---|
| `lib/mongodb.ts` | `connectDB()` — singleton Mongoose connection with reconnect logic and 10s timeout |
| `lib/email.ts` | `sendOrderConfirmation()`, `sendOrderShipped()`, `sendOrderDelivered()`, `sendStatusUpdate()` — branded HTML email templates via Nodemailer |
| `lib/roles.ts` | `AdminRole` type + `ROLE_PERMISSIONS` matrix — **browser-safe** (no mongoose import) |

### 5.6 Components

| File | Purpose |
|---|---|
| `components/Footer.tsx` | Production footer — 4 link columns, newsletter form, social icons, payment badges, legal links |
| `components/Navbar.tsx` | Top navigation used by non-admin pages |
| `components/ProductView.tsx` | Product card component used on collection/home pages |
| `context/CartContext.tsx` | `CartProvider` + `useCart()` hook — cart state in localStorage, wraps entire app via `app/layout.tsx` |
| `context/useOrders.ts` | Custom hook for fetching customer order history |

### 5.7 Routing / Middleware

| File | Purpose |
|---|---|
| `proxy.ts` | Next.js 16 proxy (middleware) — protects all `/admin/*` routes. Decodes the base64 JSON session cookie and redirects to `/admin/login` if no valid session |

---

## 6. Admin Role Permissions (RBAC)

Defined in `lib/roles.ts` — `ROLE_PERMISSIONS` object.

| Section | superadmin | manager | order_manager | analyst |
|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Orders — View | ✓ | ✓ | ✓ | ✓ |
| Orders — Edit/Delete | ✓ | Edit only | Edit only | ✗ |
| Products — View | ✓ | ✓ | ✓ | ✓ |
| Products — Create/Edit | ✓ | ✓ | ✗ | ✗ |
| Products — Bulk Import | ✓ | ✓ | ✗ | ✗ |
| Coupons — View | ✓ | ✓ | ✓ | ✓ |
| Coupons — Create/Edit | ✓ | ✓ | ✗ | ✗ |
| Analytics | ✓ | ✓ | ✗ | ✓ |
| Users — View | ✓ | ✓ | ✗ | ✗ |
| Users — Create/Edit/Delete | ✓ | ✗ | ✗ | ✗ |

**How it's enforced:**
1. `proxy.ts` — blocks unauthenticated access to all `/admin/*` routes
2. `app/admin/layout.tsx` — fetches session role via `GET /api/admin/login`, hides nav items the role can't access, shows "ACCESS DENIED" page for direct URL access to restricted sections
3. API routes — should additionally validate the session cookie server-side before mutating data (future hardening)

---

## 7. Session & Authentication

### Customer Sessions
- **Storage:** `localStorage("trident_customer")` = `{ name, email, token }`
- **Token:** base64 of `email:timestamp` — used for display only, not cryptographic
- **OTP store:** Server-side `Map<email, { otp, name, expires }>` in `app/api/auth/customer/route.ts`
- **Expiry:** 10 minutes from generation
- **No database required** for OTP — purely in-memory

### Admin Sessions
- **Storage:** httpOnly cookie `trident_admin_session`
- **Value:** `base64( JSON.stringify({ username, role, [id] }) )`
- **Secure flag:** Only set when `NEXT_PUBLIC_SITE_URL` starts with `https://` — avoids cookie being silently dropped on HTTP deployments
- **Duration:** 7 days (`maxAge: 60*60*24*7`)
- **Default credentials:** `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=trident2026` (set in `.env.local`)

---

## 8. Order ID Format

Generated in `models/Order.ts`:

```
TRD-YYYYMMDD-XXXXXX

Examples:
  TRD-20260306-A7K2X9
  TRD-20260309-B3MK12
```

- Date portion: current UTC date
- Suffix: 6 random alphanumeric characters (uppercase A-Z, 0-9)
- Guaranteed unique within the same day with negligible collision probability

---

## 9. Environment Variables

All must be set in `.env.local` at project root. The app will start without them but features will degrade gracefully.

| Variable | Required | Used By | Effect if missing |
|---|---|---|---|
| `MONGODB_URI` | Yes | All DB operations | DB calls throw — admin uses env-var fallback, store shows default products |
| `EMAIL_HOST` | No | Nodemailer | Defaults to `smtp.gmail.com` |
| `EMAIL_PORT` | No | Nodemailer | Defaults to `587` |
| `EMAIL_SECURE` | No | Nodemailer | Defaults to `false` (STARTTLS) |
| `EMAIL_USER` | Yes (email) | OTP + order emails | Emails not sent — OTP logged to server console only |
| `EMAIL_PASS` | Yes (email) | Nodemailer | Same as above |
| `STRIPE_SECRET_KEY` | Yes (card payments) | `/api/checkout` | Card payments fail |
| `STRIPE_WEBHOOK_SECRET` | Yes (webhooks) | `/api/webhooks/stripe` | Webhook signature fails — orders stay "pending" |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes (card UI) | Checkout page | Stripe UI broken |
| `NEXT_PUBLIC_SITE_URL` | Yes | Stripe redirect, cookie security | Defaults to `http://localhost:3000` |
| `ADMIN_USERNAME` | No | Admin login | Defaults to `admin` |
| `ADMIN_PASSWORD` | No | Admin login | Defaults to `trident2026` |
| `ADMIN_SALT` | No | Password hashing | Defaults to `trident_salt` |
| `NEXTAUTH_SECRET` | No | NextAuth | Defaults — only matters if NextAuth provider used |
| `NEXTAUTH_URL` | No | NextAuth | Same |

---

## 10. Data Flow — Cart

```
Customer browses → adds item to cart
  → CartContext (React state + localStorage "cart")

Checkout page loads
  → reads sessionStorage "trident_cart" (copied from cart before Stripe redirect)

Post-order
  → sessionStorage.removeItem("trident_cart")
  → cart cleared
```

**Key:** The main cart lives in `localStorage("cart")` via `CartContext`. Before Stripe redirect, the checkout page copies it to `sessionStorage("trident_cart")` so it survives the page unload. This is read back on the confirm screen for order summary display.

---

## 11. Bulk Product Import (CSV)

- **UI:** `app/admin/products/page.tsx` — CSV upload button
- **Parser:** Client-side FileReader API — no library needed
- **API:** `POST /api/products/bulk` in `app/api/products/bulk/route.ts`
- **Expected CSV columns:** `name, price, category, gender, stock, description, image`
- **Validation:** Server validates required fields before bulk insert
- **Error handling:** Returns per-row errors without failing the entire batch

---

## 12. Email Templates

All in `lib/email.ts`. Each function accepts structured data and sends a pre-built HTML email.

| Function | Trigger | Subject |
|---|---|---|
| `sendOrderConfirmation()` | POST /api/orders (COD/UPI) or Stripe webhook | "Your TRIDENT Order Confirmed — #TRD-..." |
| `sendOrderShipped()` | Admin marks order as "shipped" | "Your Order Has Shipped — #TRD-..." |
| `sendOrderDelivered()` | Admin marks order as "delivered" | "Order Delivered — #TRD-..." |
| `sendStatusUpdate()` | Any status change from admin panel | "Order Update — #TRD-..." |
| *(OTP in route.ts)* | Customer requests OTP | "Your TRIDENT Sign-In Code" |

---

## 13. Known Limitations & Production Hardening Notes

| Item | Current State | Recommended Fix |
|---|---|---|
| OTP store | In-memory Map — resets on server restart, doesn't scale across instances | Replace with Redis (`ioredis`) |
| Admin password hashing | SHA-256 + static salt | Replace with bcrypt (`bcryptjs`) |
| API route auth | Admin pages use cookie from browser — API routes don't re-validate the cookie on every mutation | Add server-side cookie check to all admin API routes |
| Image storage | Base64 stored in MongoDB | Move to Cloudinary / AWS S3 — store URL only |
| Stripe webhook | No queue — webhook must respond in <5s | For heavy processing, push to a job queue |
| Customer token | base64(email:timestamp) — not cryptographically signed | Use JWT with a secret |
| MongoDB connection | Single connection per serverless function | Already using global cache — correct pattern for Next.js |

---

## 14. Local Development Setup

```bash
# 1. Clone and install
git clone <repo>
cd trident
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values

# 3. Start dev server
npm run dev
# Open http://localhost:3000

# 4. Admin access
# Navigate to http://localhost:3000/admin/login
# Default credentials: admin / trident2026
```

### Gmail App Password Setup (for OTP emails)
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an App Password for "Mail"
4. Use the 16-character code as `EMAIL_PASS` in `.env.local`
5. Use your Gmail address as `EMAIL_USER`

### Stripe Webhook (local testing)
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret into STRIPE_WEBHOOK_SECRET in .env.local
```

---

## 15. Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` (enables secure cookie + correct Stripe redirects)
- [ ] Set strong `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Set random `ADMIN_SALT` (16+ characters)
- [ ] Set `MONGODB_URI` to MongoDB Atlas cluster URI
- [ ] Set Stripe live keys (`STRIPE_SECRET_KEY=sk_live_...`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`)
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard → `https://yourdomain.com/api/webhooks/stripe`
- [ ] Set `STRIPE_WEBHOOK_SECRET` from the Stripe dashboard webhook signing secret
- [ ] Set `EMAIL_USER` and `EMAIL_PASS` for transactional emails
- [ ] Test OTP sign-in end-to-end
- [ ] Test a Stripe payment in test mode before going live
- [ ] Run `npm run build` locally and fix any TypeScript/build errors
