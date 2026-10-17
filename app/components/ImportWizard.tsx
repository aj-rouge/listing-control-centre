"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { parseCsv, readCsvFile } from "../lib/import/csv";
import {
  autoMap,
  emptyMapping,
  transformRows,
  type Mapping,
  type ParsedRow,
} from "../lib/import/transform";
import type { ImportRow } from "../lib/import/types";
import { importStockChunk } from "../actions/import";

type Step = "upload" | "map" | "preview" | "importing" | "done";
const CHUNK_SIZE = 25;
// Excel-style column label: 0 → A, 25 → Z, 26 → AA, 27 → AB, 701 → ZZ, 702 → AAA
function columnLetter(idx: number): string {
  let n = idx + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}
const TARGETS: {
  key: keyof Omit<Mapping, "itemSecondary">;
  label: string;
  required?: boolean;
}[] = [
  { key: "item", label: "Item name", required: true },
  { key: "qty", label: "Quantity", required: true },
  { key: "sku", label: "SKU" },
  { key: "location", label: "Location" },
  { key: "condition", label: "Condition" },
  { key: "notes", label: "Notes" },
  { key: "pf_number", label: "PF number" },
  { key: "identifier_1", label: "Identifier 1 (IMEI)" },
  { key: "identifier_2", label: "Identifier 2" },
  { key: "price", label: "Price" },
];

export function ImportWizard({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>(emptyMapping);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<Record<number, string>>({});
  const [batchName, setBatchName] = useState(
    `Import ${new Date().toLocaleDateString()}`,
  );
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{
    batchId: string;
    imported: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    const text = await readCsvFile(file);
    const rows = parseCsv(text);
    if (rows.length < 2) return;
    setFileName(file.name);
    setHeaders(rows[0]);
    setRawRows(rows.slice(1));
    setMapping(autoMap(rows[0]));
    setStep("map");
  }, []);

  const handleMapNext = useCallback(() => {
    if (mapping.item === null) return;
    const { rows, errors } = transformRows(rawRows, mapping);
    setParsed(rows);
    setParseErrors(errors);
    setStep("preview");
  }, [rawRows, mapping]);

  const updateRow = useCallback((idx: number, patch: Partial<ImportRow>) => {
    setParsed((p) => p.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback((idx: number) => {
    setParsed((p) => p.filter((_, i) => i !== idx));
  }, []);

  const handleImport = useCallback(async () => {
    if (parsed.length === 0) return;
    setStep("importing");
    setProgress({ done: 0, total: parsed.length });

    let batchId: string | undefined;
    let totalImported = 0;
    const allErrors: { row: number; message: string }[] = [];

    try {
      for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
        const chunk = parsed
          .slice(i, i + CHUNK_SIZE)
          .map(({ _srcIdx, ...r }) => r);
        const res = await importStockChunk({
          batchId,
          batchName,
          batchDate: Date.now(),
          rows: chunk,
        });
        batchId = res.batchId;
        totalImported += res.imported;
        allErrors.push(
          ...res.errors.map((e) => ({ row: e.row + i, message: e.message })),
        );
        setProgress({
          done: Math.min(i + CHUNK_SIZE, parsed.length),
          total: parsed.length,
        });
      }
      setResult({
        batchId: batchId!,
        imported: totalImported,
        errors: allErrors,
      });
      setStep("done");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(
        "Import failed: " + (err instanceof Error ? err.message : String(err)),
      );
      setStep("preview");
    }
  }, [parsed, batchName, router]);

  const resetAll = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setMapping(emptyMapping());
    setParsed([]);
    setParseErrors({});
    setResult(null);
    setProgress({ done: 0, total: 0 });
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {fileName && step !== "upload" && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {fileName}
        </div>
      )}

      <Steps current={step} />

      {step === "upload" && <UploadStep onFile={handleFile} />}
      {step === "map" && (
        <MapStep
          headers={headers}
          sampleRows={rawRows.slice(0, 20)}
          mapping={mapping}
          setMapping={setMapping}
          onBack={() => setStep("upload")}
          onNext={handleMapNext}
        />
      )}
      {step === "preview" && (
        <PreviewStep
          rows={parsed}
          errors={parseErrors}
          batchName={batchName}
          setBatchName={setBatchName}
          onBack={() => setStep("map")}
          onImport={handleImport}
          onUpdateRow={updateRow}
          onRemoveRow={removeRow}
        />
      )}
      {step === "importing" && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
            Importing {progress.done} / {progress.total}…
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${
                  progress.total ? (progress.done / progress.total) * 100 : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
      {step === "done" && result && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-lg font-semibold text-green-700 dark:text-green-400">
            Import complete
          </h2>
          <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-slate-100">
              {result.imported}
            </strong>{" "}
            row
            {result.imported !== 1 && "s"} imported into batch{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {result.batchId.slice(0, 8)}
            </code>
            .
          </p>
          {result.errors.length > 0 && (
            <details className="mb-4 text-sm">
              <summary className="cursor-pointer text-red-600 dark:text-red-400">
                {result.errors.length} row{result.errors.length !== 1 && "s"}{" "}
                failed
              </summary>
              <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
                {result.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    Row {e.row + 2}: {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetAll();
                onClose?.();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                         transition-colors hover:bg-blue-700
                         focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Done
            </button>
            <button
              onClick={resetAll}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium
                         text-slate-700 transition-colors hover:bg-slate-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500/40
                         dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Import another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  const list: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Upload" },
    { key: "map", label: "2. Map columns" },
    { key: "preview", label: "3. Review & edit" },
    { key: "done", label: "4. Done" },
  ];
  const active =
    current === "importing" ? 2 : list.findIndex((x) => x.key === current);
  return (
    <ol className="mb-6 flex flex-wrap gap-2 text-sm">
      {list.map((s, i) => (
        <li
          key={s.key}
          className={`rounded-full px-3 py-1 font-medium transition-colors ${
            i === active
              ? "bg-blue-600 text-white"
              : i < active
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}

function UploadStep({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
        drag
          ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
          : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
      }`}
    >
      <p className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">
        Drop a CSV file here
      </p>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">or</p>
      <label
        className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                   transition-colors hover:bg-blue-700
                   focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/40"
      >
        Choose file
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
      <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
        Excel users: File → Save As → CSV first.
      </p>
    </div>
  );
}

function Dropdown({
  value,
  onChange,
  options,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  options: { value: number | null; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedIdx = options.findIndex((o) => o.value === value);
  const selected = selectedIdx >= 0 ? options[selectedIdx] : options[0];

  const openMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuH = Math.min(options.length * 34 + 8, 280);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < menuH && rect.top - 8 > spaceBelow;

    setPos({
      top: openUp ? rect.top - Math.min(menuH, 280) - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
    setHighlight(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  }, [options.length, selectedIdx]);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      )
        return;
      closeMenu();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = options[highlight];
        if (opt) {
          onChange(opt.value);
          closeMenu();
          triggerRef.current?.focus();
        }
      }
    };

    const onScrollOrResize = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, highlight, options, onChange, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const el = popoverRef.current?.children[highlight] as
      | HTMLElement
      | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(e) => {
          if (
            !open &&
            (e.key === "Enter" ||
              e.key === " " ||
              e.key === "ArrowDown" ||
              e.key === "ArrowUp")
          ) {
            e.preventDefault();
            e.stopPropagation();
            openMenu();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2
                   rounded-lg border border-slate-200 bg-white
                   px-3 py-2 text-left text-sm text-slate-900 transition-colors
                   hover:border-slate-300 focus:border-blue-500 focus:outline-none
                   focus:ring-2 focus:ring-blue-500/40
                   dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100
                   dark:hover:border-slate-700"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? ""}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-150 dark:text-slate-500 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            className="fixed z-[100] max-h-72 overflow-y-auto rounded-lg
                       border border-slate-200 bg-white p-1 shadow-xl
                       dark:border-slate-800 dark:bg-slate-900"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlight;
              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.value);
                    closeMenu();
                    triggerRef.current?.focus();
                  }}
                  className={`flex cursor-pointer items-center justify-between
                              gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                                isHighlighted
                                  ? "bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                >
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {isSelected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
function previewFor(col: number | null, sampleRows: string[][]): string {
  if (col === null) return "";
  const seen: string[] = [];
  for (const r of sampleRows) {
    const v = r[col]?.trim();
    if (v && !seen.includes(v)) {
      seen.push(v.length > 28 ? v.slice(0, 28) + "…" : v);
      if (seen.length >= 2) break;
    }
  }
  return seen.length
    ? `e.g. ${seen.join(" · ")}`
    : "— column is empty in sample —";
}

function MapStep({
  headers,
  sampleRows,
  mapping,
  setMapping,
  onBack,
  onNext,
}: {
  headers: string[];
  sampleRows: string[][];
  mapping: Mapping;
  setMapping: (m: Mapping) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const set = (key: keyof Mapping, v: number | null) =>
    setMapping({ ...mapping, [key]: v });

  const columnOptions = [
    { value: null as number | null, label: "— skip —" },
    ...headers.map((h, i) => ({
      value: i as number | null,
      label: h?.trim() ? h : `Col ${columnLetter(i)}`,
    })),
  ];

  const combineOptions = [
    { value: null as number | null, label: "— none —" },
    ...headers.map((h, i) => ({
      value: i as number | null,
      label: h?.trim() ? h : `Col ${columnLetter(i)}`,
    })),
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Match your file columns to database fields. Auto-guessed where possible.
        The grey line under each field shows what&apos;s actually in that column
        so you can spot mismatches before importing.
      </p>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        {TARGETS.map((t) => (
          <div key={t.key}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t.label}
              {t.required && (
                <span className="ml-1 text-red-500 dark:text-red-400">*</span>
              )}
            </label>
            <Dropdown
              value={mapping[t.key]}
              onChange={(v) => set(t.key, v)}
              options={columnOptions}
            />
            <p className="mt-1 min-h-[1rem] truncate text-xs text-slate-400 dark:text-slate-500">
              {previewFor(mapping[t.key], sampleRows)}
            </p>
          </div>
        ))}

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Item — combine with{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              (optional)
            </span>
          </label>
          <Dropdown
            value={mapping.itemSecondary}
            onChange={(v) => set("itemSecondary", v)}
            options={combineOptions}
          />
          <p className="mt-1 min-h-[1rem] truncate text-xs text-slate-400 dark:text-slate-500">
            {previewFor(mapping.itemSecondary, sampleRows)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            e.g. pick &quot;Model&quot; above and &quot;Make&quot; here →
            &quot;Apple iPhone 16 Pro 256GB Gold&quot;
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium
                     text-slate-700 transition-colors hover:bg-slate-50
                     focus:outline-none focus:ring-2 focus:ring-blue-500/40
                     dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={mapping.item === null}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

const CELL_INPUT_CLASS =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm " +
  "text-slate-900 placeholder:text-slate-400 transition-colors " +
  "hover:border-slate-300 " +
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
  "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 " +
  "dark:placeholder:text-slate-500 dark:hover:border-slate-700";

function PreviewStep({
  rows,
  errors,
  batchName,
  setBatchName,
  onBack,
  onImport,
  onUpdateRow,
  onRemoveRow,
}: {
  rows: ParsedRow[];
  errors: Record<number, string>;
  batchName: string;
  setBatchName: (v: string) => void;
  onBack: () => void;
  onImport: () => void;
  onUpdateRow: (idx: number, patch: Partial<ImportRow>) => void;
  onRemoveRow: (idx: number) => void;
}) {
  const errorCount = Object.keys(errors).length;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-medium">Batch name:</span>
          <input
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm
                       text-slate-900 placeholder:text-slate-400 transition-colors
                       hover:border-slate-300
                       focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40
                       dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100
                       dark:hover:border-slate-700"
          />
        </label>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {rows.length} row{rows.length !== 1 && "s"} ready
          {errorCount > 0 && (
            <span className="ml-2 text-red-600 dark:text-red-400">
              · {errorCount} skipped
            </span>
          )}
        </span>
      </div>

      {errorCount > 0 && (
        <details className="mb-4 text-sm">
          <summary className="cursor-pointer text-red-600 dark:text-red-400">
            {errorCount} source row{errorCount !== 1 && "s"} skipped — click to
            see why
          </summary>
          <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-300">
            {Object.entries(errors)
              .slice(0, 100)
              .map(([idx, msg]) => (
                <li key={idx}>
                  CSV line {Number(idx) + 2}: {msg}
                </li>
              ))}
          </ul>
        </details>
      )}

      <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="w-16 px-3 py-2 font-semibold">Qty</th>
              <th className="px-3 py-2 font-semibold">SKU</th>
              <th className="px-3 py-2 font-semibold">Location</th>
              <th className="px-3 py-2 font-semibold">Condition</th>
              <th className="w-24 px-3 py-2 font-semibold">Price</th>
              <th className="px-3 py-2 font-semibold">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r, i) => (
              <tr
                key={r._srcIdx}
                className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-2 text-slate-400 dark:text-slate-500">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.item}
                    onChange={(e) => onUpdateRow(i, { item: e.target.value })}
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="w-16 px-3 py-2">
                  <input
                    type="number"
                    value={r.qty}
                    onChange={(e) =>
                      onUpdateRow(i, { qty: Number(e.target.value) })
                    }
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.sku ?? ""}
                    onChange={(e) =>
                      onUpdateRow(i, { sku: e.target.value || undefined })
                    }
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.location ?? ""}
                    onChange={(e) =>
                      onUpdateRow(i, { location: e.target.value || undefined })
                    }
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.condition ?? ""}
                    onChange={(e) =>
                      onUpdateRow(i, { condition: e.target.value || undefined })
                    }
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="w-24 px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={r.price ?? ""}
                    onChange={(e) =>
                      onUpdateRow(i, {
                        price:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.notes ?? ""}
                    onChange={(e) =>
                      onUpdateRow(i, { notes: e.target.value || undefined })
                    }
                    className={CELL_INPUT_CLASS}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onRemoveRow(i)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600
                               transition-colors hover:bg-red-50 hover:text-red-700
                               dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium
                     text-slate-700 transition-colors hover:bg-slate-50
                     focus:outline-none focus:ring-2 focus:ring-blue-500/40
                     dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back
        </button>
        <button
          onClick={onImport}
          disabled={rows.length === 0 || !batchName.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import {rows.length} row{rows.length !== 1 && "s"}
        </button>
      </div>
    </div>
  );
}
