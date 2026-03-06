"use client";

import { useEffect, useState } from "react";
import { IOrder, IOrderItem, OrderStatus } from "@/types";

const PRODUCTS = [
  { id: "p1", name: "Air Flux X — Pro",    price: 189 },
  { id: "p2", name: "Vertex Runner 2.0",   price: 149 },
  { id: "p3", name: "Shadow Force Elite",  price: 229 },
  { id: "p4", name: "Pulse Drift Low",     price: 119 },
  { id: "p5", name: "Strike Force V",      price: 179 },
  { id: "p6", name: "Phantom Air Max",     price: 259 },
];

interface OrderModalProps {
  open: boolean;
  order?: IOrder | null;         // null = create mode
  onClose: () => void;
  onSave: (data: Partial<IOrder>) => Promise<void>;
}

const STATUSES: OrderStatus[] = [
  "pending", "processing", "shipped", "delivered", "cancelled",
];

const inp: React.CSSProperties = {
  width: "100%",
  background: "#0d0d0d",
  border: "1px solid #222",
  color: "#f5f5f5",
  padding: ".7rem 1rem",
  fontFamily: "'Barlow', sans-serif",
  fontSize: ".88rem",
  outline: "none",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: ".72rem",
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  color: "#888",
  marginBottom: ".4rem",
};

export default function OrderModal({ open, order, onClose, onSave }: OrderModalProps) {
  const editing = !!order;

  const blank = {
    name: "", email: "", phone: "", address: "",
    productId: PRODUCTS[0].id, productName: PRODUCTS[0].name,
    productPrice: PRODUCTS[0].price, qty: 1,
    status: "pending" as OrderStatus, notes: "",
  };

  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);

  // Populate fields when editing
  useEffect(() => {
    if (order) {
      const item = order.items?.[0];
      const prod = PRODUCTS.find((p) => p.id === item?.productId) ?? PRODUCTS[0];
      setF({
        name:         order.customer.name,
        email:        order.customer.email,
        phone:        order.customer.phone,
        address:      order.customer.address,
        productId:    item?.productId ?? prod.id,
        productName:  item?.name      ?? prod.name,
        productPrice: item?.price     ?? prod.price,
        qty:          item?.qty       ?? 1,
        status:       (order.status as OrderStatus) ?? "pending",
        notes:        order.notes ?? "",
      });
    } else {
      setF(blank);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, open]);

  if (!open) return null;

  function set(key: string, val: string | number) {
    setF((prev) => ({ ...prev, [key]: val }));
  }

  function handleProductChange(id: string) {
    const p = PRODUCTS.find((x) => x.id === id) ?? PRODUCTS[0];
    setF((prev) => ({
      ...prev,
      productId: p.id,
      productName: p.name,
      productPrice: p.price,
    }));
  }

  async function handleSave() {
    if (!f.name || !f.email) return alert("Name and email are required.");
    setSaving(true);

    const items: IOrderItem[] = [
      { productId: f.productId, name: f.productName, price: f.productPrice, qty: f.qty },
    ];

    const data: Partial<IOrder> = {
      customer: { name: f.name, email: f.email, phone: f.phone, address: f.address },
      items,
      totalAmount: f.productPrice * f.qty,
      status: f.status,
      notes: f.notes,
    };

    await onSave(data);
    setSaving(false);
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "#111", border: "1px solid #222",
          width: 540, maxWidth: "95vw", maxHeight: "90vh",
          overflowY: "auto", zIndex: 2001,
          fontFamily: "'Barlow', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1.5rem", borderBottom: "1px solid #222",
          }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.4rem", letterSpacing: 2,
            }}
          >
            {editing ? "EDIT ORDER" : "ADD ORDER"}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#f5f5f5", fontSize: "1.4rem", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <span style={label}>Customer Name *</span>
              <input style={inp} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe"/>
            </div>
            <div>
              <span style={label}>Email *</span>
              <input style={inp} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="john@email.com"/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <span style={label}>Phone</span>
              <input style={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210"/>
            </div>
            <div>
              <span style={label}>Status</span>
              <select style={inp} value={f.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} style={{ background: "#111" }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <span style={label}>Shipping Address</span>
            <input style={inp} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, Chennai, TN"/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <span style={label}>Product</span>
              <select style={inp} value={f.productId} onChange={(e) => handleProductChange(e.target.value)}>
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: "#111" }}>
                    {p.name} — ${p.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span style={label}>Quantity</span>
              <input style={inp} type="number" min={1} value={f.qty} onChange={(e) => set("qty", parseInt(e.target.value) || 1)}/>
            </div>
          </div>
          <div style={{ background: "#0a0a0a", padding: "1rem", border: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: ".78rem", color: "#888", marginBottom: ".3rem" }}>ORDER TOTAL</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem" }}>
              ${(f.productPrice * f.qty).toFixed(2)}
            </div>
          </div>
          <div>
            <span style={label}>Notes (optional)</span>
            <input style={inp} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any special instructions…"/>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex", gap: ".75rem", justifyContent: "flex-end",
            padding: "1.5rem", borderTop: "1px solid #222",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "1px solid #222", color: "#f5f5f5",
              padding: ".6rem 1.5rem", fontFamily: "'Barlow', sans-serif",
              fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5,
              textTransform: "uppercase", cursor: "pointer",
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#555" : "#e5202e", color: "#fff", border: "none",
              padding: ".6rem 1.5rem", fontFamily: "'Barlow', sans-serif",
              fontWeight: 700, fontSize: ".78rem", letterSpacing: 1.5,
              textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "SAVING…" : "SAVE ORDER"}
          </button>
        </div>
      </div>
    </>
  );
}
