content = r'''import { useState, useEffect, useCallback } from "react";
import { PackageCheck, Truck, AlertTriangle, CheckCircle2, ClipboardList, ChevronDown, ChevronUp, Package } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  getOrderDeliveryConfirmation,
  getDispatchBatchesForOrder,
  markBatchInTransit,
  confirmBatchDelivery,
  getInvoiceSubtotal,
  deriveProductDeliveryStatus,
  LOGISTICS_REASONS,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
  type ProductDeliveryLine,
  type ProductDeliveryStatus,
  type DispatchBatch,
} from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

const ACTIVE_DISPATCH_STATUSES: WorkflowLifecycleStatus[] = [
  "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered",
  "Ready For Dispatch", "Partially Delivered",
];
const CONFIRMED_STATUSES: WorkflowLifecycleStatus[] = [
  "Awaiting Invoice", "Invoice Generated", "Payment Pending",
  "Payment Verification Pending", "Payment Completed", "Order Closed",
];

function productStatusBadge(status: ProductDeliveryStatus) {
  if (status === "Delivered")        return "bg-emerald-100 text-emerald-700";
  if (status === "Partial Delivery") return "bg-amber-100 text-amber-700";
  if (status === "Not Delivered")    return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}
function overallStatusBadge(status: string) {
  if (status === "Delivered Successfully") return "bg-emerald-100 text-emerald-700";
  if (status === "Partial Delivery")       return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}
function batchStatusBadge(status: DispatchBatch["status"]) {
  if (status === "Delivered")  return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-700";
}
function slotBadge(slot: "Morning" | "Evening") {
  return slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700";
}
function deriveProductStatus(loadedQty: number, deliveredQty: number): ProductDeliveryStatus {
  return deriveProductDeliveryStatus(loadedQty, deliveredQty);
}
'''

with open('frontend/src/features/warehouse/delivery-tracking/delivery-tracking-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Part 1 done")
