"use client";
import { useSearchParams } from "next/navigation";
import DashboardStats from "./DashboardStats";
import DashboardTabs, { type DashboardTab } from "./DashboardTabs";
import BatchesView from "./BatchesView";
import ProductsView from "./ProductsView";
import { useStore } from "../lib/store";

export default function DashboardContent() {
  const searchParams = useSearchParams();

  // Default tab is "products". `?tab=batches` switches to batches.
  const rawTab = searchParams.get("tab");
  const activeTab: DashboardTab = rawTab === "batches" ? "batches" : "products";

  const batchCount = useStore((s) => s.batches.length);
  const productCount = useStore((s) => s.stock.length);
  const openNewBatch = useStore((s) => s.openNewBatch);
  const openNewStockRow = useStore((s) => s.openNewStockRow);

  return (
    <div className="space-y-6">
      <DashboardStats />

      <DashboardTabs
        activeTab={activeTab}
        batchCount={batchCount}
        productCount={productCount}
        onNewBatch={openNewBatch}
        // Picker mode — user chooses which batch inside the dialog.
        onNewProduct={() => openNewStockRow(null)}
      />

      {activeTab === "batches" ? <BatchesView /> : <ProductsView />}
    </div>
  );
}
