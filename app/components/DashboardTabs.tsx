"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type DashboardTab = "batches" | "products";

interface Props {
  activeTab: DashboardTab;
  batchCount: number;
  productCount: number;
  onNewBatch: () => void;
  onNewProduct: () => void;
}

export default function DashboardTabs({
  activeTab,
  batchCount,
  productCount,
  onNewBatch,
  onNewProduct,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setTab = (next: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    // "products" is the default — keep the URL clean.
    if (next === "products") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
      <TabButton
        active={activeTab === "products"}
        onClick={() => setTab("products")}
        label="Products"
        count={productCount}
      />
      <TabButton
        active={activeTab === "batches"}
        onClick={() => setTab("batches")}
        label="Batches"
        count={batchCount}
      />

      {activeTab === "batches" && (
        <button
          onClick={onNewBatch}
          className="ml-auto mb-2 text-sm font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800
                     dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
        >
          + New Batch
        </button>
      )}
      {activeTab === "products" && (
        <button
          onClick={onNewProduct}
          className="ml-auto mb-2 text-sm font-medium bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800
                     dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors"
        >
          + New Product
        </button>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
        active
          ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
      }`}
    >
      {label}
      <span
        className={`ml-2 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
          active
            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
