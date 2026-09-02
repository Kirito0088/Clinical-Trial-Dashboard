import { useCallback, useRef, useState } from 'react';
import Papa from 'papaparse';
import { FileUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ParsedCsv {
  name: string;
  rows: Record<string, unknown>[];
  columns: string[];
  errors: string[];
}

interface CsvDropzoneProps {
  onParsed: (result: ParsedCsv) => void;
  /** Rows beyond this are dropped, with a warning — protects the browser. */
  maxRows?: number;
  className?: string;
}

/**
 * Drop a CSV, get typed rows back.
 *
 * Parsing happens here rather than server-side on purpose: a 20MB file never
 * crosses the wire as multipart, the user sees a result immediately, and
 * `dynamicTyping` gives real numbers so the charts and the column profiler
 * work without a coercion pass.
 */
export function CsvDropzone({ onParsed, maxRows = 50_000, className }: CsvDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setBusy(true);
      setError(null);

      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        complete: (result) => {
          setBusy(false);

          const rows = result.data.filter((r) => Object.keys(r).length > 0);
          if (rows.length === 0) {
            setError('That file parsed to zero rows. Does it have a header row?');
            return;
          }

          const errors: string[] = result.errors.slice(0, 3).map((e) => `Row ${e.row}: ${e.message}`);
          if (rows.length > maxRows) {
            errors.push(`Only the first ${maxRows.toLocaleString()} of ${rows.length.toLocaleString()} rows were kept.`);
          }

          onParsed({
            name: file.name,
            rows: rows.slice(0, maxRows),
            columns: result.meta.fields ?? Object.keys(rows[0]),
            errors,
          });
        },
        error: (err) => {
          setBusy(false);
          setError(err.message);
        },
      });
    },
    [maxRows, onParsed],
  );

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          'rounded-[var(--radius-card)] border border-dashed p-6 text-center transition-colors',
          dragging
            ? 'border-[var(--color-signal)] bg-[var(--color-signal-soft)]'
            : 'border-[var(--border)] bg-[var(--card)]',
        )}
      >
        {busy ? (
          <Loader2 className="mx-auto size-6 animate-spin text-[var(--muted)]" />
        ) : (
          <FileUp className="mx-auto size-6 text-[var(--muted)]" />
        )}

        <p className="mt-2 text-sm">
          Drop a CSV here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-500 text-[var(--color-signal)] underline-offset-4 hover:underline"
          >
            choose a file
          </button>
        </p>
        <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
          Headers are read from the first row. Numbers and booleans are typed automatically.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Reset so re-picking the same file fires change again.
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
