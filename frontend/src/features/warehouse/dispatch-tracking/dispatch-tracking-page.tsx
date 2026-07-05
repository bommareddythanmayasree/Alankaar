import { useMemo, useEffect, useState, useCallback } from "react";
import {
  Truck, Package, CheckCircle2, Clock, Sun, Moon,
  MapPin, User, Hash, Calendar, ArrowRight, Navigation,
  RotateCcw, PlayCircle,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  getDispatchBatches,
  getDispatchAssignments,
  type WorkflowLifecycleStatus,
  type DispatchBatch,
} from "../../../shared/lib/demo-store";

// ─── Status helpers ───────────────────────────────────────────────────────────

const DISPATCH_STATUSES: WorkflowLifecycleStatus[] = [
  "Ready For Dispatch",
  "Morning Dispatch",
  "Evening Dispatch",
  "In Transit",
  "Delivered",
];

function statusBadge(status: string) {
  if (status === "Ready For Dispatch") return "bg-amber-100 text-amber-700";
  if (status === "Morning Dispatch")   return "bg-orange-100 text-orange-700";
  if (status === "Evening Dispatch")   return "bg-indigo-100 text-indigo-700";
  if (status === "In Transit")         return "bg-sky-100 text-sky-700";
  if (status === "Delivered")          return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function statusDot(status: string) {
  if (status === "In Transit") return "bg-sky-500";
  if (status === "Delivered")  return "bg-emerald-500";
  return "bg-amber-400";
}

// ─── Timeline event derivation ────────────────────────────────────────────────

type TimelineEvent = {
  time: string;
  label: string;
  vehicle: string;
  driver: string;
  branch: string;
  description: string;
  batchId?: string;
  eventType: "dispatch_started" | "vehicle_left" | "reached_branch" | "batch_delivered" | "vehicle_returned";
};

type WorkflowOrder = { id: string; branch: string };

function deriveTimeline(batches: DispatchBatch[], orders: WorkflowOrder[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const today = new Date().toDateString();

  for (const b of batches) {
    const created = new Date(b.createdAt);
    if (created.toDateString() !== today) continue;

    const slot = b.slot === "Morning" ? "Morning" : "Evening";
    const order = orders.find(o => o.id === b.orderId);
    const branch = order?.branch ?? "—";

    events.push({
      time: b.dispatchTime,
      label: `${slot} Dispatch Started`,
      vehicle: b.vehicleNumber,
      driver: b.driverName,
      branch,
      description: `${slot} dispatch batch ${b.batchId} loaded and ready to depart.`,
      batchId: b.batchId,
      eventType: "dispatch_started",
    });

    if (b.status === "In Transit" || b.status === "Delivered") {
      const left = new Date(created.getTime() + 15 * 60 * 1000);
      events.push({
        time: left.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Vehicle Left Warehouse",
        vehicle: b.vehicleNumber,
        driver: b.driverName,
        branch,
        description: `Vehicle departed warehouse en route to ${branch}.`,
        batchId: b.batchId,
        eventType: "vehicle_left",
      });
    }

    if (b.status === "In Transit") {
      const reached = new Date(created.getTime() + 60 * 60 * 1000);
      events.push({
        time: reached.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Reached Branch",
        vehicle: b.vehicleNumber,
        driver: b.driverName,
        branch,
        description: `Vehicle arrived at ${branch} for unloading.`,
        batchId: b.batchId,
        eventType: "reached_branch",
      });
    }

    if (b.status === "Delivered" && b.deliveredAt) {
      const del = new Date(b.deliveredAt);
      // Reached branch ~30 min before delivery confirmation
      const reached = new Date(del.getTime() - 30 * 60 * 1000);
      events.push({
        time: reached.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Reached Branch",
        vehicle: b.vehicleNumber,
        driver: b.driverName,
        branch,
        description: `Vehicle arrived at ${branch} for unloading.`,
        batchId: b.batchId,
        eventType: "reached_branch",
      });
      events.push({
        time: del.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Batch Delivered",
        vehicle: b.vehicleNumber,
        driver: b.driverName,
        branch,
        description: `All items in batch ${b.batchId} handed over and confirmed at ${branch}.`,
        batchId: b.batchId,
        eventType: "batch_delivered",
      });
      const returned = new Date(del.getTime() + 35 * 60 * 1000);
      events.push({
        time: returned.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Vehicle Returned",
        vehicle: b.vehicleNumber,
        driver: b.driverName,
        branch,
        description: `${b.vehicleNumber} returned to warehouse after completing delivery.`,
        batchId: b.batchId,
        eventType: "vehicle_returned",
      });
    }
  }

  return events.sort((a, b) => a.time.localeCompare(b.time));
}

// ─── Timeline event icon/colour helpers ──────────────────────────────────────

function timelineEventStyle(eventType: TimelineEvent["eventType"]) {
  switch (eventType) {
    case "dispatch_started":
      return { dotClass: "bg-orange-100", iconEl: <PlayCircle className="h-3 w-3 text-orange-500" /> };
    case "vehicle_left":
      return { dotClass: "bg-sky-100", iconEl: <ArrowRight className="h-3 w-3 text-sky-500" /> };
    case "reached_branch":
      return { dotClass: "bg-violet-100", iconEl: <Navigation className="h-3 w-3 text-violet-500" /> };
    case "batch_delivered":
      return { dotClass: "bg-emerald-100", iconEl: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> };
    case "vehicle_returned":
      return { dotClass: "bg-slate-100", iconEl: <RotateCcw className="h-3 w-3 text-slate-500" /> };
  }
}



type VehicleCardData = {
  vehicleNumber: string;
  driverName: string;
  branch: string;
  batchId: string;
  productCount: number;
  dispatchTime: string;
  status: string;
  orderId: string;
};

export function DispatchTrackingPage() {
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  // All data derived fresh from store on each tick — no local copies
  const { counts, vehicles, inTransitBatches, deliveredBatches, timeline } = useMemo(() => {
    const orders = getWorkflowOrders();
    const batches = getDispatchBatches();
    const assignments = getDispatchAssignments();

    // KPI counts
    const dispatchOrders = orders.filter(o => DISPATCH_STATUSES.includes(o.status as WorkflowLifecycleStatus));
    const counts = {
      readyForDispatch: dispatchOrders.filter(o => o.status === "Ready For Dispatch").length,
      morning:          dispatchOrders.filter(o => o.status === "Morning Dispatch").length,
      evening:          dispatchOrders.filter(o => o.status === "Evening Dispatch").length,
      inTransit:        dispatchOrders.filter(o => o.status === "In Transit").length,
      delivered:        dispatchOrders.filter(o => o.status === "Delivered" || o.status === "Awaiting Invoice").length,
    };

    // Vehicle cards — one per batch that has an assignment
    const vehicles: VehicleCardData[] = batches.map(b => {
      const order = orders.find(o => o.id === b.orderId);
      const assignment = assignments.find(a => a.orderId === b.orderId);
      return {
        vehicleNumber: b.vehicleNumber || assignment?.vehicleNumber || "—",
        driverName:    b.driverName    || assignment?.driverName    || "—",
        branch:        order?.branch   ?? "—",
        batchId:       b.batchId,
        productCount:  b.products.length,
        dispatchTime:  b.dispatchTime,
        status:        b.status === "Scheduled"
          ? (order?.status ?? "Ready For Dispatch")
          : b.status === "In Transit"
          ? "In Transit"
          : "Delivered",
        orderId: b.orderId,
      };
    }).filter(v => v.vehicleNumber !== "—");

    // In-transit batches
    const inTransitBatches = batches.filter(b => b.status === "In Transit").map(b => {
      const order = orders.find(o => o.id === b.orderId);
      const etaMs = new Date(b.createdAt).getTime() + 90 * 60 * 1000;
      const etaDate = new Date(etaMs);
      return {
        batchId:     b.batchId,
        orderId:     b.orderId,
        driver:      b.driverName,
        vehicle:     b.vehicleNumber,
        branch:      order?.branch ?? "—",
        eta:         etaDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        products:    b.products,
      };
    });

    // Delivered batches — today only
    const todayStr = new Date().toDateString();
    const deliveredBatches = batches
      .filter(b => {
        if (b.status !== "Delivered") return false;
        const deliveredDate = b.deliveredAt ? new Date(b.deliveredAt).toDateString() : null;
        const createdDate = new Date(b.createdAt).toDateString();
        return (deliveredDate ?? createdDate) === todayStr;
      })
      .map(b => {
        const order = orders.find(o => o.id === b.orderId);
        return {
          batchId:       b.batchId,
          branch:        order?.branch ?? "—",
          driver:        b.driverName,
          deliveredTime: b.deliveredAt
            ? new Date(b.deliveredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "—",
          status: "Delivered" as const,
        };
      });

    const timeline = deriveTimeline(batches, orders);

    return { counts, vehicles, inTransitBatches, deliveredBatches, timeline };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Dispatch Tracking")}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">Dispatch Tracking</h2>
        <p className="mt-1 text-slate-500">Real-time logistics monitoring — synced live from Orders Workflow.</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Ready For Dispatch", value: counts.readyForDispatch, bg: "bg-amber-50",   color: "text-amber-600",   Icon: Clock },
          { label: "Morning Dispatch",   value: counts.morning,          bg: "bg-orange-50",  color: "text-orange-600",  Icon: Sun },
          { label: "Evening Dispatch",   value: counts.evening,          bg: "bg-indigo-50",  color: "text-indigo-600",  Icon: Moon },
          { label: "In Transit",         value: counts.inTransit,        bg: "bg-sky-50",     color: "text-sky-600",     Icon: Truck },
          { label: "Delivered",          value: counts.delivered,        bg: "bg-emerald-50", color: "text-emerald-600", Icon: CheckCircle2 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${c.bg}`}>
              <c.Icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Live Dispatch Vehicles */}
      <section className="mb-6">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Live Dispatch Vehicles</h3>
        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No vehicles currently in dispatch. Vehicles appear here when orders reach Ready For Dispatch.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(v => (
              <div key={`${v.batchId}-${v.orderId}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusDot(v.status)}`} />
                    <span className="font-mono text-sm font-semibold text-slate-800">{v.vehicleNumber}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(v.status)}`}>
                    {v.status}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{v.driverName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{v.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{v.batchId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span>{v.productCount} product{v.productCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{v.dispatchTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today's Dispatch Timeline — full-width section */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-800">Today's Dispatch Timeline</h3>
        </div>
        {timeline.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No dispatch activity yet today.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ol className="relative space-y-0 border-l-2 border-slate-200 pl-6">
              {timeline.map((ev, i) => {
                const { dotClass, iconEl } = timelineEventStyle(ev.eventType);
                return (
                  <li key={`${ev.batchId}-${i}`} className="relative pb-6 last:pb-0">
                    {/* dot */}
                    <span className={`absolute -left-[25px] top-1 flex h-5 w-5 items-center justify-center rounded-full ${dotClass}`}>
                      {iconEl}
                    </span>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
                      {/* time */}
                      <span className="w-20 shrink-0 font-mono text-xs font-semibold text-slate-500 pt-0.5">{ev.time}</span>
                      {/* content */}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{ev.description}</p>
                        {/* meta row */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5 text-slate-400" />
                            {ev.vehicle}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {ev.driver}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {ev.branch}
                          </span>
                          {ev.batchId && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-mono">{ev.batchId}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      {/* Currently In Transit — full-width section */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-sky-500" />
          <h3 className="text-base font-semibold text-slate-800">Currently In Transit</h3>
          {inTransitBatches.length > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
              {inTransitBatches.length}
            </span>
          )}
        </div>
        {inTransitBatches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No batches currently in transit.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inTransitBatches.map(b => (
              <div key={b.batchId} className="rounded-xl border border-sky-200 bg-white p-4">
                {/* Card header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-sky-700">{b.batchId}</span>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">In Transit</span>
                </div>
                {/* Core fields */}
                <div className="mb-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-14 shrink-0">Order</span>
                    <span className="font-mono font-medium truncate">{b.orderId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-14 shrink-0">Driver</span>
                    <span className="truncate">{b.driver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-14 shrink-0">Vehicle</span>
                    <span className="font-mono truncate">{b.vehicle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-14 shrink-0">Branch</span>
                    <span className="truncate">{b.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-14 shrink-0">ETA</span>
                    <span className="font-semibold text-sky-700">{b.eta}</span>
                  </div>
                </div>
                {/* Products list */}
                <div className="border-t border-slate-100 pt-2">
                  <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    Products ({b.products.length})
                  </div>
                  <ul className="space-y-0.5">
                    {b.products.map((p, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-slate-600">
                        <span className="truncate">{p.product}</span>
                        <span className="ml-2 shrink-0 font-mono text-slate-500">{p.qty} {p.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Deliveries Today */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h3 className="text-base font-semibold text-slate-800">Completed Deliveries Today</h3>
          {deliveredBatches.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {deliveredBatches.length}
            </span>
          )}
        </div>
        {deliveredBatches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
            No deliveries completed yet today.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deliveredBatches.map(b => (
              <div key={b.batchId} className="rounded-xl border border-emerald-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-emerald-700">{b.batchId}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {b.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-20 shrink-0">Branch</span>
                    <span className="truncate">{b.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-20 shrink-0">Driver</span>
                    <span className="truncate">{b.driver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="text-slate-400 w-20 shrink-0">Delivered At</span>
                    <span className="font-semibold text-emerald-700">{b.deliveredTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ErpLayout>
  );
}
