/**
 * Fly-To-Cart animation system.
 *
 * Architecture:
 *  - FlyToCartProvider  — renders a fixed portal layer that plays the flying clone
 *  - useFlyToCart()     — returns `triggerFly(imgEl, onComplete)` called from product cards
 *  - FAB_ID             — a DOM id placed on the FAB so we can getBoundingClientRect() the target
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Public constant: put this id on the FAB button ────────────────────────────
export const CART_FAB_ID = "cart-fab-target";

// ── Types ─────────────────────────────────────────────────────────────────────
type FlyItem = {
  id: number;
  src: string;
  from: { x: number; y: number; w: number; h: number };
  to:   { x: number; y: number };
};

type FlyToCartCtx = {
  triggerFly: (imgEl: HTMLImageElement, onLand: () => void) => void;
};

const Ctx = createContext<FlyToCartCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FlyItem[]>([]);
  const counter = useRef(0);

  const triggerFly = useCallback(
    (imgEl: HTMLImageElement, onLand: () => void) => {
      // Source rect (product image)
      const src = imgEl.getBoundingClientRect();

      // Target rect (FAB button)
      const fab = document.getElementById(CART_FAB_ID);
      if (!fab) { onLand(); return; }
      const dest = fab.getBoundingClientRect();

      const id = ++counter.current;
      const item: FlyItem = {
        id,
        src: imgEl.src,
        from: { x: src.left, y: src.top, w: src.width, h: src.height },
        to:   {
          x: dest.left + dest.width  / 2,
          y: dest.top  + dest.height / 2,
        },
      };

      setItems((prev) => [...prev, item]);

      // Call onLand slightly before clone disappears (feels snappier)
      setTimeout(onLand, 480);
    },
    []
  );

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ triggerFly }}>
      {children}

      {/* Fixed portal layer — sits above everything */}
      <div className="pointer-events-none fixed inset-0 z-[9999]">
        <AnimatePresence>
          {items.map((item) => (
            <FlyingClone key={item.id} item={item} onDone={() => remove(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

// ── Flying clone component ─────────────────────────────────────────────────────
function FlyingClone({ item, onDone }: { item: FlyItem; onDone: () => void }) {
  const { from, to, src } = item;

  // Control point for arc: midpoint shifted upward
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 120;

  // We animate along a bezier path using custom keyframes
  const xKeyframes = [from.x, midX, to.x];
  const yKeyframes = [from.y, midY, to.y];
  const scaleKeyframes = [1, 0.7, 0.22];
  const opacityKeyframes = [1, 1, 0];

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden
      initial={{ x: from.x, y: from.y, width: from.w, height: from.h, scale: 1, opacity: 1, borderRadius: 8 }}
      animate={{
        x: xKeyframes,
        y: yKeyframes,
        scale: scaleKeyframes,
        opacity: opacityKeyframes,
        borderRadius: [8, 12, 50],
      }}
      transition={{
        duration: 0.65,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.5, 1],
      }}
      onAnimationComplete={onDone}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: from.w,
        height: from.h,
        objectFit: "cover",
        pointerEvents: "none",
        boxShadow: "0 8px 32px rgba(10,58,146,0.35)",
        border: "2px solid #0A3A92",
      }}
    />
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useFlyToCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFlyToCart must be used inside FlyToCartProvider");
  return ctx;
}
