"use client";
import { useMemo } from "react";
import BatchCard from "./BatchCard";
import EmptyState from "./EmptyState";
import { useStore } from "../lib/store";

export default function BatchesView() {
  const batches = useStore((s) => s.batches);

  // Newest first
  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => b.batch_date - a.batch_date),
    [batches],
  );

  if (sortedBatches.length === 0) {
    return <EmptyState label="No batches yet." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedBatches.map((b) => (
        <BatchCard key={b.id} batchId={b.id} />
      ))}
    </div>
  );
}
