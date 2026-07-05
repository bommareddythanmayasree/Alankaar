import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Truck, Package, CheckCircle2, Clock, Sun, Moon,
  User, Hash, Calendar, ArrowRight, Navigation,
  RotateCcw, PlayCircle, ChevronDown, ChevronUp,
  AlertTriangle, Bell, Star, TrendingUp, MapPin,
  Upload, Shield,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  getDispatchBatches,
  getDispatchAssignments,
  getBatchDeliveryConfirmations,
  type WorkflowLifecycleStatus,
  type DispatchBatch,
} from "../../../shared/lib/demo-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimelineEvent = {
  time: string;
  label: string;
  vehicle: string;
  driver: string;
  branch: string;
  description: string;
  batchId?: string;
  eventType: "dispatch_started" | "vehicle_left" | "reached_branch" | "batch_delivered" | "vehicle_returned" | "traffic_delay" | "pod_uploaded" | "evening_started";
};

type WorkflowOrder = { id: string; branch: string };

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

// ─── Constants ────────────────────────────────────────────────────────────────

const DISPATCH_STATUSES: WorkflowLifecycleStatus[] = [
  "Ready For Dispatch",
  "Morning Dispatch",
  "Evening Dispatch",
  "In Transit",
  "Delivered",
];

const PAGE_SIZE = 5;

// ─── Mock Presentation Data ───────────────────────────────────────────────────

const MOCK_IN_TRANSIT = [
  { batchId: "BATCH-MT-001", orderId: "ORD-MT-001", driver: "Ravi Kumar",       vehicle: "AP 29 AB 1234", branch: "Gandhi Nagar",     eta: "09:45 AM", products: [{product:"Kaju Katli",qty:12,unit:"kg"},{product:"Gulab Jamun",qty:8,unit:"kg"}] },
  { batchId: "BATCH-MT-002", orderId: "ORD-MT-002", driver: "Suresh Babu",      vehicle: "AP 29 CD 5678", branch: "Benz Circle",      eta: "10:10 AM", products: [{product:"Motichoor Laddu",qty:15,unit:"kg"},{product:"Mysore Pak",qty:6,unit:"kg"}] },
  { batchId: "BATCH-MT-003", orderId: "ORD-MT-003", driver: "Venkat Rao",       vehicle: "AP 29 EF 9012", branch: "Patamata",         eta: "10:25 AM", products: [{product:"Milk Bread",qty:40,unit:"pcs"},{product:"Brown Bread",qty:30,unit:"pcs"}] },
  { batchId: "BATCH-MT-004", orderId: "ORD-MT-004", driver: "Krishna Murthy",   vehicle: "AP 29 GH 3456", branch: "Gunadala",         eta: "10:40 AM", products: [{product:"Boondi Laddu",qty:10,unit:"kg"},{product:"Rasgulla",qty:5,unit:"kg"}] },
  { batchId: "BATCH-MT-005", orderId: "ORD-MT-005", driver: "Naresh Varma",     vehicle: "AP 29 IJ 7890", branch: "Kanuru",           eta: "11:00 AM", products: [{product:"Veg Puff",qty:60,unit:"pcs"},{product:"Egg Puff",qty:40,unit:"pcs"}] },
  { batchId: "BATCH-MT-006", orderId: "ORD-MT-006", driver: "Srinivas Reddy",   vehicle: "AP 29 KL 2345", branch: "Gayatri Nagar",   eta: "11:15 AM", products: [{product:"Chocolate Cake",qty:4,unit:"pcs"},{product:"Cup Cake",qty:24,unit:"pcs"}] },
  { batchId: "BATCH-MT-007", orderId: "ORD-MT-007", driver: "Ramesh Chandra",   vehicle: "AP 29 MN 6789", branch: "Machavaram",      eta: "11:30 AM", products: [{product:"Badusha",qty:8,unit:"kg"},{product:"Kalakand",qty:5,unit:"kg"}] },
  { batchId: "BATCH-MT-008", orderId: "ORD-MT-008", driver: "Prasad Yadav",     vehicle: "AP 29 OP 0123", branch: "Governorpet",     eta: "11:50 AM", products: [{product:"Samosa",qty:80,unit:"pcs"},{product:"Spring Roll",qty:50,unit:"pcs"}] },
  { batchId: "BATCH-MT-009", orderId: "ORD-MT-009", driver: "Ajay Singh",       vehicle: "AP 29 QR 4567", branch: "Singh Nagar",     eta: "12:05 PM", products: [{product:"Dry Fruit Barfi",qty:6,unit:"kg"},{product:"Milk Cake",qty:4,unit:"kg"}] },
  { batchId: "BATCH-MT-010", orderId: "ORD-MT-010", driver: "Ravi Kumar",       vehicle: "AP 29 AB 1234", branch: "Poranki",         eta: "12:20 PM", products: [{product:"Khara Bun",qty:50,unit:"pcs"},{product:"Cream Roll",qty:30,unit:"pcs"}] },
  { batchId: "BATCH-MT-011", orderId: "ORD-MT-011", driver: "Suresh Babu",      vehicle: "AP 29 CD 5678", branch: "Vinchipeta",      eta: "12:35 PM", products: [{product:"Plum Cake",qty:3,unit:"pcs"},{product:"Fruit Cake",qty:3,unit:"pcs"}] },
  { batchId: "BATCH-MT-012", orderId: "ORD-MT-012", driver: "Balakrishna Naidu","vehicle": "AP 29 ST 8901", branch: "Auto Nagar",  eta: "12:50 PM", products: [{product:"Butter Cookies",qty:10,unit:"kg"},{product:"Chocolate Cookies",qty:8,unit:"kg"}] },
];

const MOCK_DELIVERED = [
  { batchId: "BATCH-DL-001", branch: "Gandhi Nagar",     driver: "Ravi Kumar",       deliveredTime: "08:55 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-002", branch: "Benz Circle",      driver: "Suresh Babu",      deliveredTime: "09:10 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-003", branch: "Patamata",         driver: "Venkat Rao",       deliveredTime: "09:22 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-004", branch: "Gunadala",         driver: "Krishna Murthy",   deliveredTime: "09:38 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-005", branch: "Kanuru",           driver: "Naresh Varma",     deliveredTime: "09:50 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-006", branch: "Gayatri Nagar",   driver: "Srinivas Reddy",   deliveredTime: "10:05 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-007", branch: "Machavaram",       driver: "Ramesh Chandra",   deliveredTime: "10:18 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-008", branch: "Governorpet",      driver: "Prasad Yadav",     deliveredTime: "10:30 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-009", branch: "Narasaraopet",     driver: "Lokesh Teja",      deliveredTime: "10:45 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-010", branch: "Gannavaram",       driver: "Balakrishna Naidu",deliveredTime: "11:00 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-011", branch: "Ayyappa Nagar",    driver: "Ajay Singh",       deliveredTime: "11:12 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-012", branch: "Prasadampadu",     driver: "Ravi Kumar",       deliveredTime: "11:25 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-013", branch: "Mutyalammapadu",   driver: "Suresh Babu",      deliveredTime: "11:40 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-014", branch: "Singh Nagar",      driver: "Venkat Rao",       deliveredTime: "11:55 AM", status: "Delivered" as const },
  { batchId: "BATCH-DL-015", branch: "Poranki",          driver: "Krishna Murthy",   deliveredTime: "12:08 PM", status: "Delivered" as const },
];

const MOCK_VEHICLES: VehicleCardData[] = [
  { vehicleNumber:"AP 29 AB 1234", driverName:"Ravi Kumar",        branch:"Gandhi Nagar",    batchId:"BATCH-MV-001", productCount:14, dispatchTime:"06:00 AM", status:"In Transit",          orderId:"ORD-MV-001" },
  { vehicleNumber:"AP 29 CD 5678", driverName:"Suresh Babu",       branch:"Benz Circle",     batchId:"BATCH-MV-002", productCount:11, dispatchTime:"06:15 AM", status:"In Transit",          orderId:"ORD-MV-002" },
  { vehicleNumber:"AP 29 EF 9012", driverName:"Venkat Rao",        branch:"Patamata",        batchId:"BATCH-MV-003", productCount:18, dispatchTime:"06:30 AM", status:"Delivered",           orderId:"ORD-MV-003" },
  { vehicleNumber:"AP 29 GH 3456", driverName:"Krishna Murthy",    branch:"Gunadala",        batchId:"BATCH-MV-004", productCount:9,  dispatchTime:"06:45 AM", status:"Delivered",           orderId:"ORD-MV-004" },
  { vehicleNumber:"AP 29 IJ 7890", driverName:"Naresh Varma",      branch:"Kanuru",          batchId:"BATCH-MV-005", productCount:22, dispatchTime:"07:00 AM", status:"In Transit",          orderId:"ORD-MV-005" },
  { vehicleNumber:"AP 29 KL 2345", driverName:"Srinivas Reddy",    branch:"Gayatri Nagar",   batchId:"BATCH-MV-006", productCount:16, dispatchTime:"07:15 AM", status:"Morning Dispatch",    orderId:"ORD-MV-006" },
  { vehicleNumber:"AP 29 MN 6789", driverName:"Ramesh Chandra",    branch:"Machavaram",      batchId:"BATCH-MV-007", productCount:13, dispatchTime:"07:30 AM", status:"Delivered",           orderId:"ORD-MV-007" },
  { vehicleNumber:"AP 29 OP 0123", driverName:"Prasad Yadav",      branch:"Governorpet",     batchId:"BATCH-MV-008", productCount:20, dispatchTime:"07:45 AM", status:"In Transit",          orderId:"ORD-MV-008" },
  { vehicleNumber:"AP 29 QR 4567", driverName:"Ajay Singh",        branch:"Singh Nagar",     batchId:"BATCH-MV-009", productCount:8,  dispatchTime:"08:00 AM", status:"Ready For Dispatch",  orderId:"ORD-MV-009" },
  { vehicleNumber:"AP 29 ST 8901", driverName:"Balakrishna Naidu", branch:"Poranki",         batchId:"BATCH-MV-010", productCount:17, dispatchTime:"08:15 AM", status:"Morning Dispatch",    orderId:"ORD-MV-010" },
  { vehicleNumber:"AP 29 UV 2345", driverName:"Lokesh Teja",       branch:"Vinchipeta",      batchId:"BATCH-MV-011", productCount:12, dispatchTime:"08:30 AM", status:"Delivered",           orderId:"ORD-MV-011" },
  { vehicleNumber:"AP 29 WX 6789", driverName:"Ravi Kumar",        branch:"Auto Nagar",      batchId:"BATCH-MV-012", productCount:25, dispatchTime:"08:45 AM", status:"In Transit",          orderId:"ORD-MV-012" },
  { vehicleNumber:"AP 29 YZ 0123", driverName:"Suresh Babu",       branch:"Gannavaram",      batchId:"BATCH-MV-013", productCount:10, dispatchTime:"09:00 AM", status:"Morning Dispatch",    orderId:"ORD-MV-013" },
  { vehicleNumber:"AP 29 AA 4567", driverName:"Venkat Rao",        branch:"Ayyappa Nagar",   batchId:"BATCH-MV-014", productCount:19, dispatchTime:"09:15 AM", status:"Ready For Dispatch",  orderId:"ORD-MV-014" },
  { vehicleNumber:"AP 29 BB 8901", driverName:"Krishna Murthy",    branch:"Prasadampadu",    batchId:"BATCH-MV-015", productCount:15, dispatchTime:"09:30 AM", status:"In Transit",          orderId:"ORD-MV-015" },
  { vehicleNumber:"AP 29 CC 2345", driverName:"Naresh Varma",      branch:"Mutyalammapadu",  batchId:"BATCH-MV-016", productCount:7,  dispatchTime:"09:45 AM", status:"Evening Dispatch",    orderId:"ORD-MV-016" },
  { vehicleNumber:"AP 29 DD 6789", driverName:"Srinivas Reddy",    branch:"Narasaraopet",    batchId:"BATCH-MV-017", productCount:21, dispatchTime:"10:00 AM", status:"Delivered",           orderId:"ORD-MV-017" },
  { vehicleNumber:"AP 29 EE 0123", driverName:"Ramesh Chandra",    branch:"Gandhi Nagar",    batchId:"BATCH-MV-018", productCount:11, dispatchTime:"03:00 PM", status:"Evening Dispatch",    orderId:"ORD-MV-018" },
  { vehicleNumber:"AP 29 FF 4567", driverName:"Prasad Yadav",      branch:"Benz Circle",     batchId:"BATCH-MV-019", productCount:16, dispatchTime:"03:15 PM", status:"Evening Dispatch",    orderId:"ORD-MV-019" },
  { vehicleNumber:"AP 29 GG 8901", driverName:"Ajay Singh",        branch:"Patamata",        batchId:"BATCH-MV-020", productCount:9,  dispatchTime:"03:30 PM", status:"Ready For Dispatch",  orderId:"ORD-MV-020" },
  { vehicleNumber:"AP 29 HH 2345", driverName:"Lokesh Teja",       branch:"Kanuru",          batchId:"BATCH-MV-021", productCount:14, dispatchTime:"03:45 PM", status:"Evening Dispatch",    orderId:"ORD-MV-021" },
  { vehicleNumber:"AP 29 II 6789", driverName:"Balakrishna Naidu", branch:"Machavaram",      batchId:"BATCH-MV-022", productCount:18, dispatchTime:"04:00 PM", status:"Ready For Dispatch",  orderId:"ORD-MV-022" },
];

// ─── Mock Timeline (30–40 chronological events) ───────────────────────────────

const MOCK_TIMELINE: (Omit<TimelineEvent, "eventType"> & { eventType: TimelineEvent["eventType"] })[] = [
  { time:"05:45 AM", label:"Morning Dispatch Started",    vehicle:"AP 29 AB 1234", driver:"Ravi Kumar",        branch:"Gandhi Nagar",   description:"Morning shift commenced. First batch loaded and sealed.",        eventType:"dispatch_started" },
  { time:"05:55 AM", label:"Vehicle Left Warehouse",      vehicle:"AP 29 AB 1234", driver:"Ravi Kumar",        branch:"Gandhi Nagar",   description:"Vehicle departed warehouse en route to Gandhi Nagar.",            eventType:"vehicle_left" },
  { time:"06:00 AM", label:"Morning Dispatch Started",    vehicle:"AP 29 CD 5678", driver:"Suresh Babu",       branch:"Benz Circle",    description:"Second morning batch loaded. Sweets & bakery items packed.",       eventType:"dispatch_started" },
  { time:"06:10 AM", label:"Vehicle Left Warehouse",      vehicle:"AP 29 CD 5678", driver:"Suresh Babu",       branch:"Benz Circle",    description:"Vehicle departed for Benz Circle.",                               eventType:"vehicle_left" },
  { time:"06:20 AM", label:"Morning Dispatch Started",    vehicle:"AP 29 EF 9012", driver:"Venkat Rao",        branch:"Patamata",       description:"Third morning batch ready. Bread and snacks loaded.",             eventType:"dispatch_started" },
  { time:"06:30 AM", label:"Vehicle Left Warehouse",      vehicle:"AP 29 EF 9012", driver:"Venkat Rao",        branch:"Patamata",       description:"Departed warehouse. ETA Patamata 07:15 AM.",                      eventType:"vehicle_left" },
  { time:"06:50 AM", label:"Reached Branch",              vehicle:"AP 29 AB 1234", driver:"Ravi Kumar",        branch:"Gandhi Nagar",   description:"Vehicle arrived at Gandhi Nagar for unloading.",                  eventType:"reached_branch" },
  { time:"07:05 AM", label:"Delivery Completed",          vehicle:"AP 29 AB 1234", driver:"Ravi Kumar",        branch:"Gandhi Nagar",   description:"All items handed over. Delivery confirmed at Gandhi Nagar.",      eventType:"batch_delivered" },
  { time:"07:08 AM", label:"Proof of Delivery Uploaded",  vehicle:"AP 29 AB 1234", driver:"Ravi Kumar",        branch:"Gandhi Nagar",   description:"Digital POD uploaded. Signature captured on device.",             eventType:"pod_uploaded" },
  { time:"07:15 AM", label:"Reached Branch",              vehicle:"AP 29 CD 5678", driver:"Suresh Babu",       branch:"Benz Circle",    description:"Vehicle arrived at Benz Circle for unloading.",                   eventType:"reached_branch" },
  { time:"07:20 AM", label:"Traffic Delay",               vehicle:"AP 29 EF 9012", driver:"Venkat Rao",        branch:"Patamata",       description:"Minor traffic delay near Patamata junction. ETA revised to 07:40 AM.", eventType:"traffic_delay" },
  { time:"07:28 AM", label:"Delivery Completed",          vehicle:"AP 29 CD 5678", driver:"Suresh Babu",       branch:"Benz Circle",    description:"All items delivered and confirmed at Benz Circle.",               eventType:"batch_delivered" },
  { time:"07:30 AM", label:"Proof of Delivery Uploaded",  vehicle:"AP 29 CD 5678", driver:"Suresh Babu",       branch:"Benz Circle",    description:"POD submitted. Receiver signature confirmed.",                    eventType:"pod_uploaded" },
  { time:"07:42 AM", label:"Reached Branch",              vehicle:"AP 29 EF 9012", driver:"Venkat Rao",        branch:"Patamata",       description:"Vehicle arrived at Patamata after traffic delay.",                eventType:"reached_branch" },
  { time:"07:55 AM", label:"Delivery Completed",          vehicle:"AP 29 EF 9012", driver:"Venkat Rao",        branch:"Patamata",       description:"Delivery completed. All items confirmed at Patamata.",            eventType:"batch_delivered" },
  { time:"08:05 AM", label:"Vehicle Returned",            vehicle:"AP 29 AB 1234", driver:"Ravi Kumar",        branch:"Gandhi Nagar",   description:"AP 29 AB 1234 returned to warehouse successfully.",              eventType:"vehicle_returned" },
  { time:"08:15 AM", label:"Reached Branch",              vehicle:"AP 29 GH 3456", driver:"Krishna Murthy",    branch:"Gunadala",       description:"Vehicle arrived at Gunadala branch.",                             eventType:"reached_branch" },
  { time:"08:20 AM", label:"Vehicle Returned",            vehicle:"AP 29 CD 5678", driver:"Suresh Babu",       branch:"Benz Circle",    description:"AP 29 CD 5678 back at warehouse. Ready for next slot.",           eventType:"vehicle_returned" },
  { time:"08:30 AM", label:"Delivery Completed",          vehicle:"AP 29 GH 3456", driver:"Krishna Murthy",    branch:"Gunadala",       description:"Batch delivered at Gunadala. Items verified by branch manager.",  eventType:"batch_delivered" },
  { time:"08:32 AM", label:"Proof of Delivery Uploaded",  vehicle:"AP 29 GH 3456", driver:"Krishna Murthy",    branch:"Gunadala",       description:"POD uploaded and confirmed.",                                     eventType:"pod_uploaded" },
  { time:"08:45 AM", label:"Morning Dispatch Started",    vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"Additional morning batch dispatched for Machavaram.",             eventType:"dispatch_started" },
  { time:"08:50 AM", label:"Vehicle Returned",            vehicle:"AP 29 EF 9012", driver:"Venkat Rao",        branch:"Patamata",       description:"AP 29 EF 9012 returned. Ready for evening slot.",                 eventType:"vehicle_returned" },
  { time:"09:00 AM", label:"Vehicle Left Warehouse",      vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"Vehicle departed for Machavaram route.",                          eventType:"vehicle_left" },
  { time:"09:10 AM", label:"Traffic Delay",               vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"Roadblock reported near NH 16. Driver taking alternate route.",   eventType:"traffic_delay" },
  { time:"09:20 AM", label:"Vehicle Returned",            vehicle:"AP 29 GH 3456", driver:"Krishna Murthy",    branch:"Gunadala",       description:"AP 29 GH 3456 returned to warehouse.",                            eventType:"vehicle_returned" },
  { time:"09:35 AM", label:"Reached Branch",              vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"Arrived Machavaram via alternate route.",                         eventType:"reached_branch" },
  { time:"09:50 AM", label:"Delivery Completed",          vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"All items delivered. Delay noted in trip log.",                   eventType:"batch_delivered" },
  { time:"09:52 AM", label:"Proof of Delivery Uploaded",  vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"Digital receipt and signature captured for Machavaram delivery.", eventType:"pod_uploaded" },
  { time:"10:15 AM", label:"Vehicle Returned",            vehicle:"AP 29 MN 6789", driver:"Ramesh Chandra",    branch:"Machavaram",     description:"AP 29 MN 6789 returned to warehouse after delay.",               eventType:"vehicle_returned" },
  { time:"02:45 PM", label:"Evening Dispatch Started",    vehicle:"AP 29 EE 0123", driver:"Ramesh Chandra",    branch:"Gandhi Nagar",   description:"Evening shift underway. First evening batch loaded.",             eventType:"evening_started" },
  { time:"03:00 PM", label:"Vehicle Left Warehouse",      vehicle:"AP 29 EE 0123", driver:"Ramesh Chandra",    branch:"Gandhi Nagar",   description:"AP 29 EE 0123 departed for Gandhi Nagar evening delivery.",      eventType:"vehicle_left" },
  { time:"03:15 PM", label:"Evening Dispatch Started",    vehicle:"AP 29 FF 4567", driver:"Prasad Yadav",      branch:"Benz Circle",    description:"Second evening batch sealed and vehicle prepped.",                eventType:"evening_started" },
  { time:"03:20 PM", label:"Vehicle Left Warehouse",      vehicle:"AP 29 FF 4567", driver:"Prasad Yadav",      branch:"Benz Circle",    description:"Vehicle en route to Benz Circle for evening delivery.",           eventType:"vehicle_left" },
  { time:"03:45 PM", label:"Reached Branch",              vehicle:"AP 29 EE 0123", driver:"Ramesh Chandra",    branch:"Gandhi Nagar",   description:"Arrived Gandhi Nagar for evening unloading.",                    eventType:"reached_branch" },
  { time:"04:00 PM", label:"Delivery Completed",          vehicle:"AP 29 EE 0123", driver:"Ramesh Chandra",    branch:"Gandhi Nagar",   description:"Evening delivery at Gandhi Nagar completed.",                    eventType:"batch_delivered" },
  { time:"04:02 PM", label:"Proof of Delivery Uploaded",  vehicle:"AP 29 EE 0123", driver:"Ramesh Chandra",    branch:"Gandhi Nagar",   description:"Evening POD submitted with branch manager signature.",            eventType:"pod_uploaded" },
  { time:"04:10 PM", label:"Reached Branch",              vehicle:"AP 29 FF 4567", driver:"Prasad Yadav",      branch:"Benz Circle",    description:"Vehicle arrived at Benz Circle for evening batch.",               eventType:"reached_branch" },
  { time:"04:25 PM", label:"Delivery Completed",          vehicle:"AP 29 FF 4567", driver:"Prasad Yadav",      branch:"Benz Circle",    description:"Evening delivery confirmed at Benz Circle.",                     eventType:"batch_delivered" },
  { time:"04:45 PM", label:"Vehicle Returned",            vehicle:"AP 29 EE 0123", driver:"Ramesh Chandra",    branch:"Gandhi Nagar",   description:"AP 29 EE 0123 returned after evening run.",                      eventType:"vehicle_returned" },
  { time:"05:05 PM", label:"Vehicle Returned",            vehicle:"AP 29 FF 4567", driver:"Prasad Yadav",      branch:"Benz Circle",    description:"AP 29 FF 4567 returned to warehouse. Day complete.",             eventType:"vehicle_returned" },
];

// ─── Mock Alerts ──────────────────────────────────────────────────────────────

type AlertSeverity = "warning" | "success" | "info";
type DispatchAlert = { id: string; severity: AlertSeverity; title: string; detail: string; time: string };

const MOCK_ALERTS: DispatchAlert[] = [
  { id:"a1",  severity:"warning", title:"Traffic Delay — Machavaram",       detail:"AP 29 MN 6789 delayed ~25 min via NH 16 detour.",               time:"09:10 AM" },
  { id:"a2",  severity:"warning", title:"Traffic Delay — Patamata",         detail:"AP 29 EF 9012 reported junction hold-up. Resolved.",            time:"07:20 AM" },
  { id:"a3",  severity:"success", title:"Delivery Confirmed — Gandhi Nagar",detail:"Morning batch delivered. POD uploaded by Ravi Kumar.",          time:"07:08 AM" },
  { id:"a4",  severity:"success", title:"Delivery Confirmed — Benz Circle", detail:"Morning batch delivered. Signature captured by Suresh Babu.",   time:"07:30 AM" },
  { id:"a5",  severity:"success", title:"Delivery Confirmed — Gunadala",    detail:"Batch verified by branch manager at Gunadala.",                 time:"08:32 AM" },
  { id:"a6",  severity:"info",    title:"Evening Dispatch Commenced",       detail:"Evening slot vehicles loaded. 4 routes active.",                time:"02:45 PM" },
  { id:"a7",  severity:"success", title:"Delivery Confirmed — Machavaram",  detail:"Delayed batch delivered successfully at Machavaram.",           time:"09:52 AM" },
  { id:"a8",  severity:"warning", title:"Temperature Alert — Sweets Batch", detail:"BATCH-MT-006 sweet items require cool storage on arrival.",     time:"11:15 AM" },
  { id:"a9",  severity:"success", title:"All Morning Routes Cleared",       detail:"All 10 morning vehicles completed deliveries by 12:15 PM.",     time:"12:15 PM" },
  { id:"a10", severity:"info",    title:"Vehicle Check-in — AP 29 GG 8901",detail:"Vehicle cleared QC. Ready for 03:30 PM evening dispatch.",      time:"03:00 PM" },
];

// ─── Driver Performance ───────────────────────────────────────────────────────

type DriverStat = { driver: string; deliveries: number; onTime: number; trips: number; rating: number };

const MOCK_DRIVER_STATS: DriverStat[] = [
  { driver:"Ravi Kumar",        deliveries:5, onTime:5, trips:3, rating:4.9 },
  { driver:"Suresh Babu",       deliveries:4, onTime:4, trips:2, rating:4.8 },
  { driver:"Venkat Rao",        deliveries:4, onTime:3, trips:2, rating:4.5 },
  { driver:"Krishna Murthy",    deliveries:3, onTime:3, trips:2, rating:4.9 },
  { driver:"Naresh Varma",      deliveries:2, onTime:2, trips:1, rating:4.7 },
  { driver:"Srinivas Reddy",    deliveries:3, onTime:3, trips:2, rating:4.8 },
  { driver:"Ramesh Chandra",    deliveries:3, onTime:2, trips:2, rating:4.4 },
  { driver:"Prasad Yadav",      deliveries:2, onTime:2, trips:2, rating:4.6 },
  { driver:"Ajay Singh",        deliveries:2, onTime:2, trips:1, rating:4.7 },
  { driver:"Lokesh Teja",       deliveries:2, onTime:2, trips:1, rating:4.8 },
  { driver:"Balakrishna Naidu", deliveries:2, onTime:2, trips:2, rating:4.9 },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === "Ready For Dispatch") return "bg-amber-100 text-amber-700";
  if (status === "Morning Dispatch")   return "bg-orange-100 text-orange-700";
  if (status === "Evening Dispatch")   return "bg-indigo-100 text-indigo-700";
  if (status === "In Transit")         return "bg-sky-100 text-sky-700";
  if (status === "Delivered")          return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function statusDot(status: string) {
  if (status === "Ready For Dispatch") return "bg-amber-400";
  if (status === "Morning Dispatch")   return "bg-orange-400";
  if (status === "Evening Dispatch")   return "bg-indigo-400";
  if (status === "In Transit")         return "bg-sky-400 animate-pulse";
  if (status === "Delivered")          return "bg-emerald-400";
  return "bg-slate-300";
}

function alertStyle(severity: AlertSeverity) {
  if (severity === "warning") return { border: "border-amber-200 bg-amber-50",  icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> };
  if (severity === "success") return { border: "border-emerald-200 bg-emerald-50", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> };
  return { border: "border-sky-200 bg-sky-50", icon: <Bell className="h-4 w-4 text-sky-500 shrink-0" /> };
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────

function deriveTimeline(batches: DispatchBatch[], orders: WorkflowOrder[], batchBranchFallback: Record<string, string>): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const today = new Date().toDateString();

  for (const b of batches) {
    const created = new Date(b.createdAt);
    if (created.toDateString() !== today) continue;

    const slot = b.slot === "Morning" ? "Morning" : "Evening";
    const order = orders.find(o => o.id === b.orderId);
    const branch = order?.branch || batchBranchFallback[b.batchId] || "—";

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
      const reached = new Date(del.getTime() - 30 * 60 * 1000);
      events.push({
        time: reached.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Reached Branch", vehicle: b.vehicleNumber, driver: b.driverName, branch,
        description: `Vehicle arrived at ${branch} for unloading.`,
        batchId: b.batchId, eventType: "reached_branch",
      });
      events.push({
        time: del.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Batch Delivered", vehicle: b.vehicleNumber, driver: b.driverName, branch,
        description: `All items in batch ${b.batchId} handed over and confirmed at ${branch}.`,
        batchId: b.batchId, eventType: "batch_delivered",
      });
      const returned = new Date(del.getTime() + 35 * 60 * 1000);
      events.push({
        time: returned.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        label: "Vehicle Returned", vehicle: b.vehicleNumber, driver: b.driverName, branch,
        description: `${b.vehicleNumber} returned to warehouse after completing delivery.`,
        batchId: b.batchId, eventType: "vehicle_returned",
      });
    }
  }

  return events.sort((a, b) => a.time.localeCompare(b.time));
}

function timelineEventStyle(eventType: TimelineEvent["eventType"]) {
  switch (eventType) {
    case "dispatch_started": return { dotClass: "bg-orange-100", iconEl: <PlayCircle className="h-3 w-3 text-orange-500" /> };
    case "vehicle_left":     return { dotClass: "bg-sky-100",    iconEl: <ArrowRight className="h-3 w-3 text-sky-500" /> };
    case "reached_branch":   return { dotClass: "bg-violet-100", iconEl: <Navigation className="h-3 w-3 text-violet-500" /> };
    case "batch_delivered":  return { dotClass: "bg-emerald-100",iconEl: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> };
    case "vehicle_returned": return { dotClass: "bg-slate-100",  iconEl: <RotateCcw className="h-3 w-3 text-slate-500" /> };
    case "traffic_delay":    return { dotClass: "bg-amber-100",  iconEl: <AlertTriangle className="h-3 w-3 text-amber-500" /> };
    case "pod_uploaded":     return { dotClass: "bg-teal-100",   iconEl: <Upload className="h-3 w-3 text-teal-500" /> };
    case "evening_started":  return { dotClass: "bg-indigo-100", iconEl: <Moon className="h-3 w-3 text-indigo-500" /> };
  }
}

// ─── Merge helpers ────────────────────────────────────────────────────────────

/** Merge live data with mock data, deduplicating by batchId. Live records take precedence. */
function mergeByBatchId<T extends { batchId: string }>(live: T[], mock: T[]): T[] {
  const liveIds = new Set(live.map(x => x.batchId));
  return [...live, ...mock.filter(m => !liveIds.has(m.batchId))];
}

function mergeVehicles(live: VehicleCardData[], mock: VehicleCardData[]): VehicleCardData[] {
  const liveIds = new Set(live.map(v => v.batchId));
  return [...live, ...mock.filter(m => !liveIds.has(m.batchId))];
}

function mergeTimeline(live: TimelineEvent[], mock: TimelineEvent[]): TimelineEvent[] {
  // Use all mock events plus any live events not already represented
  const mockLabels = new Set(mock.map(e => `${e.time}-${e.label}-${e.vehicle}`));
  const extraLive = live.filter(e => !mockLabels.has(`${e.time}-${e.label}-${e.vehicle}`));
  return [...mock, ...extraLive].sort((a, b) => a.time.localeCompare(b.time));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DispatchTrackingPage() {
  const [tick, setTick] = useState(0);

  // Section collapse state
  const [vehiclesOpen, setVehiclesOpen]         = useState(true);
  const [vehiclesExpanded, setVehiclesExpanded] = useState(false);
  const [transitOpen, setTransitOpen]           = useState(true);
  const [transitExpanded, setTransitExpanded]   = useState(false);
  const [deliveredOpen, setDeliveredOpen]       = useState(true);
  const [deliveredExpanded, setDeliveredExpanded] = useState(false);
  const [timelineOpen, setTimelineOpen]         = useState(true);
  const [alertsOpen, setAlertsOpen]             = useState(true);
  const [performanceOpen, setPerformanceOpen]   = useState(true);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const { counts, vehicles, inTransitBatches, deliveredBatches, timeline } = useMemo(() => {
    const orders      = getWorkflowOrders();
    const batches     = getDispatchBatches();
    const assignments = getDispatchAssignments();

    const batchConfBranchMap: Record<string, string> = {};
    for (const c of getBatchDeliveryConfirmations()) {
      if (c.branch) batchConfBranchMap[c.batchId] = c.branch;
    }
    const resolveBranch = (batchId: string, orderId: string): string => {
      const order = orders.find(o => o.id === orderId);
      return order?.branch || batchConfBranchMap[batchId] || "—";
    };

    const dispatchOrders = orders.filter(o => DISPATCH_STATUSES.includes(o.status as WorkflowLifecycleStatus));
    const liveCounts = {
      readyForDispatch: dispatchOrders.filter(o => o.status === "Ready For Dispatch").length,
      morning:          dispatchOrders.filter(o => o.status === "Morning Dispatch").length,
      evening:          dispatchOrders.filter(o => o.status === "Evening Dispatch").length,
      inTransit:        dispatchOrders.filter(o => o.status === "In Transit").length,
      delivered:        dispatchOrders.filter(o => o.status === "Delivered" || o.status === "Awaiting Invoice").length,
    };

    // Merge counts: use max(live, mock floor) to always look busy
    const counts = {
      readyForDispatch: Math.max(liveCounts.readyForDispatch, 4),
      morning:          Math.max(liveCounts.morning, 7),
      evening:          Math.max(liveCounts.evening, 5),
      inTransit:        Math.max(liveCounts.inTransit, 12),
      delivered:        Math.max(liveCounts.delivered, 15),
    };

    const liveVehicles: VehicleCardData[] = batches.map(b => {
      const order      = orders.find(o => o.id === b.orderId);
      const assignment = assignments.find(a => a.orderId === b.orderId);
      return {
        vehicleNumber: b.vehicleNumber || assignment?.vehicleNumber || "—",
        driverName:    b.driverName    || assignment?.driverName    || "—",
        branch:        resolveBranch(b.batchId, b.orderId),
        batchId:       b.batchId,
        productCount:  b.products.length,
        dispatchTime:  b.dispatchTime,
        status: b.status === "Scheduled"
          ? (order?.status ?? "Ready For Dispatch")
          : b.status === "In Transit" ? "In Transit" : "Delivered",
        orderId: b.orderId,
      };
    }).filter(v => v.vehicleNumber !== "—");

    const vehicles = mergeVehicles(liveVehicles, MOCK_VEHICLES);

    const liveTransit = batches.filter(b => b.status === "In Transit").map(b => {
      const etaMs = new Date(b.createdAt).getTime() + 90 * 60 * 1000;
      return {
        batchId:  b.batchId,
        orderId:  b.orderId,
        driver:   b.driverName,
        vehicle:  b.vehicleNumber,
        branch:   resolveBranch(b.batchId, b.orderId),
        eta:      new Date(etaMs).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        products: b.products,
      };
    });
    const inTransitBatches = mergeByBatchId(liveTransit, MOCK_IN_TRANSIT);

    const todayStr     = new Date().toDateString();
    const liveDelivered = batches
      .filter(b => {
        if (b.status !== "Delivered") return false;
        const d = b.deliveredAt ? new Date(b.deliveredAt).toDateString() : null;
        return (d ?? new Date(b.createdAt).toDateString()) === todayStr;
      })
      .map(b => ({
        batchId:       b.batchId,
        branch:        resolveBranch(b.batchId, b.orderId),
        driver:        b.driverName,
        deliveredTime: b.deliveredAt
          ? new Date(b.deliveredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "—",
        status: "Delivered" as const,
      }));
    const deliveredBatches = mergeByBatchId(liveDelivered, MOCK_DELIVERED);

    const liveTimeline = deriveTimeline(batches, orders, batchConfBranchMap);
    const timeline     = mergeTimeline(liveTimeline, MOCK_TIMELINE);

    return { counts, vehicles, inTransitBatches, deliveredBatches, timeline };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  // ─── Sliced for display ───────────────────────────────────────────────────

  const visibleVehicles  = vehiclesExpanded  ? vehicles          : vehicles.slice(0, PAGE_SIZE);
  const visibleTransit   = transitExpanded   ? inTransitBatches  : inTransitBatches.slice(0, PAGE_SIZE);
  const visibleDelivered = deliveredExpanded ? deliveredBatches  : deliveredBatches.slice(0, PAGE_SIZE);

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

      {/* ── Live Dispatch Vehicles ── */}
      <section className="mb-6">
        <button type="button" onClick={() => setVehiclesOpen(o => !o)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50">
          <Truck className="h-4 w-4 text-slate-500" />
          <span className="flex-1 text-sm font-semibold text-slate-800">Live Dispatch Vehicles</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{vehicles.length}</span>
          {vehiclesOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {vehiclesOpen && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleVehicles.map(v => (
                <div key={`${v.batchId}-${v.orderId}`} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusDot(v.status)}`} />
                      <span className="font-mono text-sm font-semibold text-slate-800">{v.vehicleNumber}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(v.status)}`}>{v.status}</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" /><span>{v.driverName}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span>{v.branch}</span></div>
                    <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-slate-400" /><span className="font-mono">{v.batchId}</span></div>
                    <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-slate-400" /><span>{v.productCount} product{v.productCount !== 1 ? "s" : ""}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-slate-400" /><span>{v.dispatchTime}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {vehicles.length > PAGE_SIZE && (
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => setVehiclesExpanded(e => !e)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                  {vehiclesExpanded
                    ? <><ChevronUp className="h-3.5 w-3.5" /> View Less</>
                    : <><ChevronDown className="h-3.5 w-3.5" /> View More ({vehicles.length - PAGE_SIZE} more)</>}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Currently In Transit ── */}
      <section className="mb-6">
        <button type="button" onClick={() => setTransitOpen(o => !o)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-left transition-colors hover:bg-sky-50">
          <Truck className="h-4 w-4 text-sky-500" />
          <span className="flex-1 text-sm font-semibold text-slate-800">Currently In Transit</span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">{inTransitBatches.length}</span>
          {transitOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {transitOpen && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTransit.map(b => (
                <div key={b.batchId} className="rounded-xl border border-sky-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-sky-700">{b.batchId}</span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">In Transit</span>
                  </div>
                  <div className="mb-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-14 shrink-0">Order</span><span className="font-mono font-medium truncate">{b.orderId}</span></div>
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-14 shrink-0">Driver</span><span className="truncate">{b.driver}</span></div>
                    <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-14 shrink-0">Vehicle</span><span className="font-mono truncate">{b.vehicle}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-14 shrink-0">Branch</span><span className="truncate font-medium">{b.branch}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-14 shrink-0">ETA</span><span className="font-semibold text-sky-700">{b.eta}</span></div>
                  </div>
                  <div className="border-t border-slate-100 pt-2">
                    <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Package className="h-3.5 w-3.5 text-slate-400" />Products ({b.products.length})
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
            {inTransitBatches.length > PAGE_SIZE && (
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => setTransitExpanded(e => !e)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                  {transitExpanded
                    ? <><ChevronUp className="h-3.5 w-3.5" /> View Less</>
                    : <><ChevronDown className="h-3.5 w-3.5" /> View More ({inTransitBatches.length - PAGE_SIZE} more)</>}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Completed Deliveries Today ── */}
      <section className="mb-6">
        <button type="button" onClick={() => setDeliveredOpen(o => !o)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-left transition-colors hover:bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="flex-1 text-sm font-semibold text-slate-800">Completed Deliveries Today</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{deliveredBatches.length}</span>
          {deliveredOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {deliveredOpen && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDelivered.map(b => (
                <div key={b.batchId} className="rounded-xl border border-emerald-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-emerald-700">{b.batchId}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{b.status}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-20 shrink-0">Branch</span><span className="truncate font-medium">{b.branch}</span></div>
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-20 shrink-0">Driver</span><span className="truncate">{b.driver}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="text-slate-400 w-20 shrink-0">Delivered At</span><span className="font-semibold text-emerald-700">{b.deliveredTime}</span></div>
                  </div>
                </div>
              ))}
            </div>
            {deliveredBatches.length > PAGE_SIZE && (
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => setDeliveredExpanded(e => !e)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">
                  {deliveredExpanded
                    ? <><ChevronUp className="h-3.5 w-3.5" /> View Less</>
                    : <><ChevronDown className="h-3.5 w-3.5" /> View More ({deliveredBatches.length - PAGE_SIZE} more)</>}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Today's Dispatch Timeline ── */}
      <section className="mb-6">
        <button type="button" onClick={() => setTimelineOpen(o => !o)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="flex-1 text-sm font-semibold text-slate-800">Today's Dispatch Timeline</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{timeline.length} events</span>
          {timelineOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {timelineOpen && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <ol className="relative space-y-0 border-l-2 border-slate-200 pl-6">
              {timeline.map((ev, i) => {
                const { dotClass, iconEl } = timelineEventStyle(ev.eventType);
                return (
                  <li key={`${ev.batchId ?? "tl"}-${i}`} className="relative pb-6 last:pb-0">
                    <span className={`absolute -left-[25px] top-1 flex h-5 w-5 items-center justify-center rounded-full ${dotClass}`}>
                      {iconEl}
                    </span>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
                      <span className="w-20 shrink-0 font-mono text-xs font-semibold text-slate-500 pt-0.5">{ev.time}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{ev.description}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-slate-400" />{ev.vehicle}</span>
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" />{ev.driver}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{ev.branch}</span>
                          {ev.batchId && (
                            <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5 text-slate-400" /><span className="font-mono">{ev.batchId}</span></span>
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

      {/* ── Dispatch Alerts ── */}
      <section className="mb-6">
        <button type="button" onClick={() => setAlertsOpen(o => !o)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-left transition-colors hover:bg-amber-50">
          <Bell className="h-4 w-4 text-amber-500" />
          <span className="flex-1 text-sm font-semibold text-slate-800">Dispatch Alerts</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{MOCK_ALERTS.length}</span>
          {alertsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {alertsOpen && (
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_ALERTS.map(alert => {
              const { border, icon } = alertStyle(alert.severity);
              return (
                <div key={alert.id} className={`flex items-start gap-3 rounded-xl border p-4 ${border}`}>
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{alert.title}</p>
                      <span className="shrink-0 font-mono text-xs text-slate-400">{alert.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{alert.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Driver Performance Today ── */}
      <section className="mb-6">
        <button type="button" onClick={() => setPerformanceOpen(o => !o)}
          className="mb-3 flex w-full items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-left transition-colors hover:bg-violet-50">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          <span className="flex-1 text-sm font-semibold text-slate-800">Driver Performance Today</span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">{MOCK_DRIVER_STATS.length} drivers</span>
          {performanceOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {performanceOpen && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3 text-center">Deliveries</th>
                  <th className="px-4 py-3 text-center">On Time</th>
                  <th className="px-4 py-3 text-center">Trips</th>
                  <th className="px-4 py-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DRIVER_STATS.map((d, i) => (
                  <tr key={d.driver} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100">
                          <User className="h-4 w-4 text-violet-500" />
                        </div>
                        <span className="font-medium text-slate-800">{d.driver}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{d.deliveries}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      <span className={d.onTime === d.deliveries ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                        {d.onTime}/{d.deliveries}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">{d.trips}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700">{d.rating.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">All drivers cleared pre-shift vehicle inspection today.</span>
            </div>
          </div>
        )}
      </section>

    </ErpLayout>
  );
}
