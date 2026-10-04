import type { PlatformKey, Stage } from "./types";

export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "ebay", label: "eBay" },
  { key: "amazon", label: "Amazon" },
  { key: "onbuy", label: "OnBuy" },
  { key: "tiktok", label: "TikTok" },
  { key: "backmarket", label: "Back Market" },
  { key: "wowcher", label: "Wowcher" },
  { key: "ebay_live", label: "eBay Live" },
];

export const STAGES: Exclude<Stage, "blocked">[] = [
  "incoming",
  "arrived",
  "checked",
  "listed",
  "published",
  "done",
];

export const STAGE_LABEL: Record<Stage, string> = {
  incoming: "Incoming",
  arrived: "Arrived",
  checked: "Checked",
  listed: "BaseLinker",
  published: "Listed",
  done: "Done",
  blocked: "Blocked",
};

export const STAGE_PILL: Record<Stage, string> = {
  incoming:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
  arrived: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
  checked: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  listed:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  published:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  done: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};
