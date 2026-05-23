'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const PER_PAGE_OPTIONS = [5, 10, 50];

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = PER_PAGE_OPTIONS,
}: TablePaginationProps) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3">
      {/* Left: rows-per-page selector + showing info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-theme-text-muted whitespace-nowrap">Rows per page</label>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-theme-border bg-theme-bg-card px-2 py-1 text-xs text-theme-text focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        {totalItems > 0 && (
          <span className="text-xs text-theme-text-muted">
            Showing {start}–{end} of {totalItems}
          </span>
        )}
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="rounded-lg border border-theme-border p-1.5 text-theme-text-secondary disabled:opacity-30 hover:bg-theme-bg-hover hover:text-theme-text transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs text-theme-text-secondary tabular-nums">
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-theme-border p-1.5 text-theme-text-secondary disabled:opacity-30 hover:bg-theme-bg-hover hover:text-theme-text transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
