import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { getProductImage } from "../../shared/utils/product-images";
import { useWarehouseProducts, useWarehouseForBranch, type StockItem } from "../warehouse/warehouse-context";
import { getApprovedPendingProducts, getLiveStock } from "../../shared/lib/demo-store";

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
  currentStatus:
    | "Pending Approval"
    | "Approved"
    | "Rejected"
    | "Packed"
    | "Dispatched"
    | "In Transit"
    | "Delivered"
    | "Payment Completed";
  amount: number;
  branch: string;
  items: PlacedOrderItem[];
  statusHistory: { status: string; timestamp: string; by: string }[];
  paymentMethod?: string;
  invoiceNumber?: string;
  paymentCompleted?: boolean;
};

type OrderContextValue = {
  orders: PlacedOrder[];
  placeOrder: (items: CartItem[], paymentMethod: string) => PlacedOrder;
  payOrder: (orderId: string) => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

// ── Catalog Products (dynamic from warehouse) ─────────────────────────────────

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  code: string;
  image: string;
  isLowStock: boolean;
  isNearExpiry: boolean;
};

type CatalogContextValue = {
  catalogProducts: CatalogProduct[];
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

// ── Helper: map warehouse StockItem → CatalogProduct ─────────────────────────

function toCatalogProduct(item: StockItem): CatalogProduct {
  const categoryMap: Record<string, string> = {
    "Bakery Products": "Bakery",
    "Sweets": "Sweets",
    "Snacks": "Snacks",
    "Beverages": "Beverages",
    "Seasonal Products": "Seasonal",
  };
  const isLowStock = item.currentStock > 0 && item.currentStock <= item.minimumStock;
  let isNearExpiry = false;
  if (item.expiryDate && item.currentStock > 0) {
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    isNearExpiry = daysLeft <= 30;
  }
  return {
    id: item.id,
    name: item.productName,
    category: categoryMap[item.category] ?? item.category,
    price: item.sellingPrice,
    stock: item.currentStock,
    code: item.id,
    image: item.image || getProductImage(item.productName),
    isLowStock,
    isNearExpiry,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  const warehouseProducts = useWarehouseProducts();
  const { markPaymentComplete, addBranchNotification, addOrderFromBranch, registerBranchStatusUpdater, products: warehouseStockProducts } = useWarehouseForBranch();

  // Only show Approved products in branch catalog (undefined means original seeded = approved)
  const catalogProducts: CatalogProduct[] = (() => {
    const fromWarehouse = (warehouseProducts ?? [])
      .filter((p) => !p.approvalStatus || p.approvalStatus === "Approved")
      .map(toCatalogProduct);

    // Also merge in approved pending products from localStorage
    const approvedPending = getApprovedPendingProducts();
    const existingNames = new Set(fromWarehouse.map((p) => p.name.toLowerCase()));
    const fromPending: CatalogProduct[] = approvedPending
      .filter((ap) => !existingNames.has(ap.productName.toLowerCase()))
      .map((ap) => {
        // Use live stock override if set (reflects post-dispatch deductions)
        const liveStock = getLiveStock(ap.id, ap.stock);
        return {
          id: ap.id,
          name: ap.productName,
          category: ap.category,
          price: ap.price,
          stock: liveStock,
          code: ap.id,
          image: ap.image || getProductImage(ap.productName),
          isLowStock: liveStock < 50 && liveStock > 0,
          isNearExpiry: false,
        };
      });

    return [...fromWarehouse, ...fromPending];
  })();

  // Register a callback so warehouse approve/reject syncs status back to branch orders
  useEffect(() => {
    registerBranchStatusUpdater((orderId: string, status: string) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderId !== orderId) return o;
          const mappedStatus = status === "Approved" || status === "Partial"
            ? "Approved" as const
            : "Rejected" as const;
          return {
            ...o,
            currentStatus: mappedStatus,
            statusHistory: [
              ...o.statusHistory,
              { status: mappedStatus, timestamp: `${dateStr} ${timeStr}`, by: "Warehouse" },
            ],
          };
        })
      );
    });
  }, [registerBranchStatusUpdater]);

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
    (items: CartItem[], paymentMethod: string): PlacedOrder => {
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
        currentStatus: "Pending Approval",
        amount,
        branch: "Gandhi Nagar",
        items: items.map((i) => ({ name: i.name, qty: i.quantity })),
        statusHistory: [
          {
            status: "Pending Approval",
            timestamp: `${dateStr} ${timeStr}`,
            by: "Branch Manager",
          },
        ],
        paymentMethod,
        invoiceNumber: undefined,
        paymentCompleted: false,
      };

      setOrders((prev) => [newOrder, ...prev]);

      // Push to warehouse order verification — flushSync ensures state commits
      // before any navigation triggered by the caller, so Order Verification
      // always sees the new order immediately on mount.
      flushSync(() => {
        addOrderFromBranch({
          id: orderId,
          branch: newOrder.branch,
          date: dateStr,
          itemsCount: items.length,
          amount,
          status: "Pending",
          items: items.map((i) => {
            const stockItem = warehouseStockProducts.find(
              (p) => p.productName.toLowerCase() === i.name.toLowerCase()
            );
            return {
              name: i.name,
              requested: i.quantity,
              available: stockItem ? stockItem.currentStock : i.quantity,
            };
          }),
          partialFulfillment: false,
          emailSent: false,
          paymentStatus: undefined,
          invoiceNumber: undefined,
        });
      });

      // Notify branch: order submitted
      addBranchNotification({
        type: "order_pending",
        title: "Order Submitted",
        message: `Order ${orderId} submitted and waiting for warehouse approval.`,
        timestamp: `${dateStr} ${timeStr}`,
        read: false,
      });

      return newOrder;
    },
    [addBranchNotification, addOrderFromBranch, warehouseStockProducts]
  );

  const payOrder = useCallback(
    (orderId: string) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderId !== orderId) return o;
          return {
            ...o,
            currentStatus: "Payment Completed" as const,
            paymentCompleted: true,
            statusHistory: [
              ...o.statusHistory,
              {
                status: "Payment Completed",
                timestamp: `${dateStr} ${timeStr}`,
                by: "Branch Manager",
              },
            ],
          };
        })
      );

      // Cross-notify warehouse
      markPaymentComplete(orderId);

      // Notify branch
      addBranchNotification({
        type: "order_approved",
        title: "Payment Completed",
        message: `Payment for order ${orderId} has been completed successfully.`,
        timestamp: `${dateStr} ${timeStr}`,
        read: false,
      });
    },
    [markPaymentComplete, addBranchNotification]
  );

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeItem, clearCart }}>
      <OrderContext.Provider value={{ orders, placeOrder, payOrder }}>
        <CatalogContext.Provider value={{ catalogProducts }}>
          {children}
        </CatalogContext.Provider>
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

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within BranchProvider");
  return ctx;
}
