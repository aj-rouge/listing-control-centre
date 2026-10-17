import { getDb } from "./lib/db/client";
import { getBatches, getStockWithMarketplaces } from "./lib/db/queries";
import DashboardHydrator from "./DashboardHydrator";

export default async function Page() {
  const db = await getDb();
  const [batches, stock] = await Promise.all([
    getBatches(db),
    getStockWithMarketplaces(db),
  ]);
  return <DashboardHydrator batches={batches} stock={stock} />;
}
