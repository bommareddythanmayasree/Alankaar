import React, { createContext, useCallback, useContext, useState } from "react";
import { getProductImage } from "../../shared/utils/product-images";

// ── Cart ──────────────────────────────────────────────────────────────────────

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CartContextValue = {
  cartItems: CartItem[];
  addToCart: (product: { id: string; name: string; price: number }) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// ── Order ─────────────────────────────────────────────────────────────────────

export type PlacedOrderItem = { name: string; qty: number };

export type PlacedOrder = {
  orderId: string;
  orderDate: string;
  expectedDelivery: string;
  currentStatus: "Order Placed" | "Approved" | "Packed" | "Dispatched" | "In Transit" | "Delivered";
  amount: number;
  branch: string;
  items: PlacedOrderItem[];
  statusHistory: { status: string; timestamp: string; by: string }[];
};

type OrderContextValue = {
  orders: PlacedOrder[];
  placeOrder: (items: CartItem[]) => PlacedOrder;
};

const OrderContext = createContext<OrderContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  const addToCart = useCallback((product: { id: string; name: string; price: number }) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: getProductImage(product.name),
        },
      ];
    });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const placeOrder = useCallback(
    (items: CartItem[]): PlacedOrder => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 2);
      const expectedStr = expectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const orderId = `ORD-${Date.now().toString().slice(-4)}`;
      const amount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const newOrder: PlacedOrder = {
        orderId,
        orderDate: dateStr,
        expectedDelivery: expectedStr,
        currentStatus: "Order Placed",
        amount,
        branch: "Gandhi Nagar",
        items: items.map((i) => ({ name: i.name, qty: i.quantity })),
        statusHistory: [
          { status: "Order Placed", timestamp: `${dateStr} ${timeStr}`, by: "Branch Manager" },
        ],
      };

      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    },
    []
  );

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeItem, clearCart }}>
      <OrderContext.Provider value={{ orders, placeOrder }}>
        {children}
      </OrderContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within BranchProvider");
  return ctx;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within BranchProvider");
  return ctx;
}
