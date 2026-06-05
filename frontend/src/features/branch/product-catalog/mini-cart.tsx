import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../app/branch/branch-context";
import { CART_FAB_ID } from "./fly-to-cart";

// ── Mini Cart Drawer ──────────────────────────────────────────────────────────

function MiniCartDrawer({ onClose }: { onClose: () => void }) {
  const { cartItems, updateQty, removeItem } = useCart();
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40"
      onClick={handleOverlayClick}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.28, ease: "easeInOut" }}
        className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A3A92] px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-base font-semibold">My Cart</span>
            {cartItems.length > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-16">
              <ShoppingCart className="h-14 w-14 opacity-30" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <button
                onClick={() => onClose()}
                className="mt-2 text-xs font-semibold text-[#0A3A92] underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover shrink-0 border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e2e8f0'/%3E%3C/svg%3E";
                  }}
                />
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{item.name}</p>
                  <p className="text-xs text-slate-500">&#8377;{item.price.toFixed(2)} / unit</p>

                  <div className="mt-auto flex items-center justify-between">
                    {/* Qty controls */}
                    <div className="inline-flex items-center rounded-md border border-slate-200 bg-white overflow-hidden">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="grid h-7 w-7 place-items-center text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="grid h-7 w-7 place-items-center text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Line total + remove */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        &#8377;{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary + actions */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-xl font-bold text-[#0A3A92]">&#8377;{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-400">GST & delivery calculated at checkout</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => go("/branch/shopping-cart")}
                className="h-10 rounded-md border-2 border-[#0A3A92] text-sm font-semibold text-[#0A3A92] hover:bg-[#EEF4FF] transition-colors"
              >
                View Cart
              </button>
              <button
                onClick={() => go("/branch/checkout")}
                className="h-10 rounded-md bg-[#0A3A92] text-sm font-semibold text-white hover:bg-[#083173] transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </motion.aside>
    </div>
  );
}

// ── Floating Action Button ────────────────────────────────────────────────────

export function MiniCartFAB({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { cartItems } = useCart();
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <motion.button
        id={CART_FAB_ID}
        onClick={onToggle}
        aria-label="Open mini cart"
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0A3A92] text-white shadow-lg hover:bg-[#083173] transition-colors duration-150"
      >
        <ShoppingCart className="h-6 w-6" />
        <AnimatePresence mode="popLayout">
          {totalQty > 0 && (
            <motion.span
              key={totalQty}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow"
            >
              {totalQty > 99 ? "99+" : totalQty}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && <MiniCartDrawer onClose={onToggle} />}
      </AnimatePresence>
    </>
  );
}
