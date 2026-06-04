"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
router.get("/admin", middleware_1.requireAuth, (0, middleware_1.requireRole)("ADMIN"), async (_req, res) => {
    const [branches, products, pendingOrders, deliveredOrders] = await Promise.all([
        prisma_1.prisma.branch.count(),
        prisma_1.prisma.product.count(),
        prisma_1.prisma.order.count({ where: { status: "PENDING" } }),
        prisma_1.prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);
    // These dashboard numbers are intentionally computed server-side.
    // UI will format into ₹ and percentages to match screenshot.
    const totalRevenue = await prisma_1.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ["APPROVED", "PACKED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"] } },
    });
    res.json({
        cards: {
            totalRevenuePaise: totalRevenue._sum.totalAmount ?? 0,
            totalOrders: await prisma_1.prisma.order.count(),
            totalProducts: products,
            totalBranches: branches,
            totalEmployees: await prisma_1.prisma.employee.count(),
            totalStockValuePaise: 0,
            pendingOrders,
            deliveredOrders,
        },
    });
});
router.get("/warehouse", middleware_1.requireAuth, (0, middleware_1.requireRole)("WAREHOUSE_MANAGER"), async (_req, res) => {
    const [totalProducts, totalBranches, pendingOrders, todaysDispatches] = await Promise.all([
        prisma_1.prisma.product.count(),
        prisma_1.prisma.branch.count(),
        prisma_1.prisma.order.count({ where: { status: "PENDING" } }),
        prisma_1.prisma.order.count({ where: { status: { in: ["DISPATCHED", "IN_TRANSIT", "DELIVERED"] } } }),
    ]);
    res.json({
        cards: { totalProducts, totalBranches, pendingOrders, todaysDispatches },
    });
});
router.get("/branch", middleware_1.requireAuth, (0, middleware_1.requireRole)("BRANCH_MANAGER"), async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.branchId)
        return res.status(400).json({ message: "Branch not linked for user" });
    const branchId = user.branchId;
    const [pending, approved, inTransit, delivered] = await Promise.all([
        prisma_1.prisma.order.count({ where: { branchId, status: "PENDING" } }),
        prisma_1.prisma.order.count({ where: { branchId, status: "APPROVED" } }),
        prisma_1.prisma.order.count({ where: { branchId, status: "IN_TRANSIT" } }),
        prisma_1.prisma.order.count({ where: { branchId, status: "DELIVERED" } }),
    ]);
    const branch = await prisma_1.prisma.branch.findUnique({ where: { id: branchId } });
    res.json({
        cards: { pending, approved, inTransit, delivered },
        branch,
    });
});
exports.dashboardRoutes = router;
