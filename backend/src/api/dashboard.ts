import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import { prisma } from "../db/prisma";

const router = Router();

router.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    const [branches, products, pendingOrders, deliveredOrders] = await Promise.all([
      prisma.branch.count(),
      prisma.product.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);

    // These dashboard numbers are intentionally computed server-side.
    // UI will format into ₹ and percentages to match screenshot.
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["APPROVED", "PACKED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"] } },
    });

    res.json({
      cards: {
        totalRevenuePaise: totalRevenue._sum.totalAmount ?? 0,
        totalOrders: await prisma.order.count(),
        totalProducts: products,
        totalBranches: branches,
        totalEmployees: await prisma.employee.count(),
        totalStockValuePaise: 0,
        pendingOrders,
        deliveredOrders,
      },
    });
  }
);

router.get(
  "/warehouse",
  requireAuth,
  requireRole("WAREHOUSE_MANAGER"),
  async (_req, res) => {
    const [totalProducts, totalBranches, pendingOrders, todaysDispatches] = await Promise.all([
      prisma.product.count(),
      prisma.branch.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: { in: ["DISPATCHED", "IN_TRANSIT", "DELIVERED"] } } }),
    ]);

    res.json({
      cards: { totalProducts, totalBranches, pendingOrders, todaysDispatches },
    });
  }
);

router.get(
  "/branch",
  requireAuth,
  requireRole("BRANCH_MANAGER"),
  async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.branchId) return res.status(400).json({ message: "Branch not linked for user" });

    const branchId = user.branchId;
    const [pending, approved, inTransit, delivered] = await Promise.all([
      prisma.order.count({ where: { branchId, status: "PENDING" } }),
      prisma.order.count({ where: { branchId, status: "APPROVED" } }),
      prisma.order.count({ where: { branchId, status: "IN_TRANSIT" } }),
      prisma.order.count({ where: { branchId, status: "DELIVERED" } }),
    ]);

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    res.json({
      cards: { pending, approved, inTransit, delivered },
      branch,
    });
  }
);

export const dashboardRoutes = router;

