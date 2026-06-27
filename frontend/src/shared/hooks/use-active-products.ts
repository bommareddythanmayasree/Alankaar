/**
 * useActiveProducts — single source of truth for the active product list.
 *
 * Returns the full list of active products that should appear in:
 *  - Product Catalog (Place Order)
 *  - Shopping Cart / Checkout
 *  - Advance Orders dropdown
 *  - Warehouse Production planning
 *
 * Base list: BRANCH_ORDER_INTELLIGENCE (static, always present)
 * Dynamic additions: approved pending products from demo-store
 *
 * Re-evaluates on localStorage "storage" events so newly approved/removed
 * products appear without a page refresh.
 */

import { useState, useEffect } from "react";
import { BRANCH_ORDER_INTELLIGENCE, type OrderIntelligence } from "../data/workflow-mock-data";
import { getApprovedPendingProducts } from "../lib/demo-store";

export function useActiveProducts(): OrderIntelligence[] {
  const [products, setProducts] = useState<OrderIntelligence[]>(buildList);

  useEffect(() => {
    const handler = () => setProducts(buildList());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return products;
}

/** Build the merged, deduplicated product list */
function buildList(): OrderIntelligence[] {
  const base = BRANCH_ORDER_INTELLIGENCE;
  const baseNames = new Set(base.map((p) => p.product.toLowerCase()));

  const approved = getApprovedPendingProducts()
    .filter((p) => !baseNames.has(p.productName.toLowerCase()))
    .map<OrderIntelligence>((p) => ({
      product: p.productName,
      unit: p.unit,
      price: p.price,
      PreviousQty: 0,
      lastWeekAvg: 0,
      suggestedQty: 1,
    }));

  return [...base, ...approved];
}
