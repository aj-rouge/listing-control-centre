const C = {
  slate: "text-slate-900 dark:text-slate-100",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
  green: "text-green-600 dark:text-green-400",
} as const;

export default function MiniStat({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: string | number;
  color?: keyof typeof C;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition-colors">
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {label}
      </div>
      <div className={`text-2xl font-bold ${C[color]} mt-0.5`}>{value}</div>
    </div>
  );
}
