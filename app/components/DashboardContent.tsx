"use client";
import { useState } from "react"; // ← new
import { useSearchParams } from "next/navigation";
import DashboardStats from "./DashboardStats";
import DashboardTabs, { type DashboardTab } from "./DashboardTabs";
import BatchesView from "./BatchesView";
import ProductsView from "./ProductsView";
import ImportDialog from "./ImportDialog"; // ← new
import { useStore } from "../lib/store";

export default function DashboardContent() {
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: DashboardTab = rawTab === "batches" ? "batches" : "products";

  const batchCount = useStore((s) => s.batches.length);
  const productCount = useStore((s) => s.stock.length);
  const openNewBatch = useStore((s) => s.openNewBatch);
  const openNewStockRow = useStore((s) => s.openNewStockRow);

  const [importOpen, setImportOpen] = useState(false); // ← new

  return (
    <div className="space-y-6">
      <DashboardStats />

      <DashboardTabs
        activeTab={activeTab}
        batchCount={batchCount}
        productCount={productCount}
        onNewBatch={openNewBatch}
        onNewProduct={() => openNewStockRow(null)}
        onImport={() => setImportOpen(true)} // ← new
      />

      {activeTab === "batches" ? <BatchesView /> : <ProductsView />}

      <ImportDialog // ← new
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
