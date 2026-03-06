"use client";

import { useState, useCallback } from "react";
import { IOrder } from "@/types";

interface UseOrdersReturn {
  orders: IOrder[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchOrders: (params?: FetchParams) => Promise<void>;
  createOrder: (data: Partial<IOrder>) => Promise<IOrder | null>;
  updateOrder: (id: string, data: Partial<IOrder>) => Promise<IOrder | null>;
  deleteOrder: (id: string) => Promise<boolean>;
}

interface FetchParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (params: FetchParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params.page)   qs.set("page",   String(params.page));
      if (params.limit)  qs.set("limit",  String(params.limit));
      if (params.status) qs.set("status", params.status);
      if (params.search) qs.set("search", params.search);

      const res = await fetch(`/api/orders?${qs.toString()}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      setOrders(json.data);
      setTotal(json.pagination?.total ?? json.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (data: Partial<IOrder>): Promise<IOrder | null> => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as IOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      return null;
    }
  }, []);

  const updateOrder = useCallback(
    async (id: string, data: Partial<IOrder>): Promise<IOrder | null> => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data as IOrder;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update order");
        return null;
      }
    },
    []
  );

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
      return false;
    }
  }, []);

  return { orders, total, loading, error, fetchOrders, createOrder, updateOrder, deleteOrder };
}
