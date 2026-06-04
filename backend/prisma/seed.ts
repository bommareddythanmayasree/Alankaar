import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, ProductCategory } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Branch
  const vijayawada = await prisma.branch.upsert({
    where: { code: "BR-001" },
    update: {},
    create: {
      code: "BR-001",
      name: "Vijayawada Branch",
      managerName: "Ramesh Kumar",
      address: "Vijayawada, AP",
      phone: "+91 98765 43210",
      email: "branch1@alankar.com",
      status: "ACTIVE",
    },
  });

  const passwordHash = await bcrypt.hash("Password@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@alankar.com" },
    update: {},
    create: {
      email: "admin@alankar.com",
      passwordHash,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "warehouse@alankar.com" },
    update: {},
    create: {
      email: "warehouse@alankar.com",
      passwordHash,
      name: "Warehouse Admin",
      role: "WAREHOUSE_MANAGER",
    },
  });

  await prisma.user.upsert({
    where: { email: "branch1.manager@alankar.com" },
    update: {},
    create: {
      email: "branch1.manager@alankar.com",
      passwordHash,
      name: "Ramesh Kumar",
      role: "BRANCH_MANAGER",
      branchId: vijayawada.id,
    },
  });

  // Products (enough for dashboards / catalog grids)
  const products = [
    { sku: "SKU-KAJU-KATLI", name: "Kaju Katli", category: ProductCategory.SWEETS, sellingPrice: 68000, gstPercent: 5 },
    { sku: "SKU-RASGULLA", name: "Rasgulla", category: ProductCategory.SWEETS, sellingPrice: 28000, gstPercent: 5 },
    { sku: "SKU-MILK-CAKE", name: "Milk Cake", category: ProductCategory.SWEETS, sellingPrice: 60000, gstPercent: 5 },
    { sku: "SKU-DRY-FRUIT-LADDU", name: "Dry Fruit Laddu", category: ProductCategory.SWEETS, sellingPrice: 56000, gstPercent: 5 },
    { sku: "SKU-CHOCOLATE-CAKE", name: "Chocolate Cake", category: ProductCategory.BAKERY, sellingPrice: 65000, gstPercent: 5 },
    { sku: "SKU-VEG-PUFF", name: "Veg Puff", category: ProductCategory.SNACKS, sellingPrice: 2500, gstPercent: 5 },
    { sku: "SKU-MILK-BREAD", name: "Milk Bread", category: ProductCategory.BAKERY, sellingPrice: 4500, gstPercent: 5 },
    { sku: "SKU-GULAB-JAMUN", name: "Gulab Jamun", category: ProductCategory.SWEETS, sellingPrice: 26000, gstPercent: 5 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, category: p.category, sellingPrice: p.sellingPrice, gstPercent: p.gstPercent },
      create: { ...p },
    });

    await prisma.inventory.upsert({
      where: { id: `${product.id}-inv` },
      update: { quantity: 100, unit: "pcs", costPrice: Math.round(p.sellingPrice * 0.6), sellingPrice: p.sellingPrice },
      create: {
        id: `${product.id}-inv`,
        productId: product.id,
        quantity: 100,
        unit: "pcs",
        costPrice: Math.round(p.sellingPrice * 0.6),
        sellingPrice: p.sellingPrice,
        batchNumber: "BATCH-2026-01",
        supplier: "Alankar Suppliers",
        status: "ACTIVE",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

