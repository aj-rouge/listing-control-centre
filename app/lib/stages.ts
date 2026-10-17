import type { Stock, Stage } from "./types";

export function allRequiredLive(s: Stock): boolean {
  const req = s.marketplaces.filter((m) => m.required);
  if (req.length === 0) return false;
  return req.every((m) => m.status === "live");
}

export function stage(s: Stock): Stage {
  if (s.blocked) return "blocked";
  if (s.completed_at) return "done";
  if (s.listed_at && allRequiredLive(s)) return "published";
  if (s.listed_at) return "listed";
  if (s.checked_at) return "checked";
  if (s.arrived_at) return "arrived";
  return "incoming";
}

export function isListingRemaining(s: Stock): boolean {
  return !s.completed_at && !s.is_replenishment;
}
export function isReplenishmentRemaining(s: Stock): boolean {
  return !s.completed_at && s.is_replenishment === 1;
}

export function stageIndex(s: Stage): number {
  if (s === "blocked") return 2;
  const order: Stage[] = [
    "incoming",
    "arrived",
    "checked",
    "listed",
    "published",
    "done",
  ];
  return order.indexOf(s);
}

export interface NextAction {
  label: string;
  key: "markArrived" | "markChecked" | "markListed" | "markDone" | null;
}

export function nextAction(s: Stock): NextAction | null {
  if (s.blocked) return null;

  // 1. Prioritize data preparation steps (can be done before arrival)
  if (!s.checked_at) return { label: "Mark Checked", key: "markChecked" };
  if (!s.listed_at && !s.is_replenishment)
    return { label: "Mark BaseLinker created", key: "markListed" };

  // 2. Marketplace status
  if (s.listed_at && !allRequiredLive(s))
    return { label: "Waiting on marketplaces", key: null };
  if (allRequiredLive(s) && !s.completed_at)
    return { label: "Mark Fully Complete", key: "markDone" };

  // 3. Physical arrival (optional, moved to the end)
  if (!s.arrived_at) return { label: "Mark Arrived", key: "markArrived" };

  return null;
}
