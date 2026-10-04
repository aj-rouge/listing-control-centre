"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DarkModeToggle } from "./DarkModeToggle";

function NavLink({ href, label }: { href: string; label: string }) {
  const path = usePathname();
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}

export default function TopBar() {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"
        >
          <span className="text-lg">📦</span> Listing Control Centre
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {/* Add your nav links here, e.g. */}
          {/* <NavLink href="/batches" label="Batches" /> */}
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
