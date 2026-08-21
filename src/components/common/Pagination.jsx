import { ChevronLeft, ChevronRight } from 'lucide-react';

const getPages = (page, totalPages) => {
  const pages = [];
  const push = (p) => { if (!pages.includes(p)) pages.push(p); };
  const window = 1;
  for (let p = 1; p <= Math.min(2, totalPages); p++) push(p);
  for (let p = page - window; p <= page + window; p++) {
    if (p >= 1 && p <= totalPages) push(p);
  }
  for (let p = Math.max(totalPages - 1, 1); p <= totalPages; p++) push(p);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('...');
    result.push(p);
  });
  return result;
};

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = getPages(page, totalPages);

  const btnBase = 'min-w-[2.25rem] h-9 px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-colors';
  const idle = 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700';
  const disabled = 'text-surface-300 dark:text-surface-600 cursor-not-allowed';

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10" aria-label="pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="previous"
        className={`${btnBase} ${page <= 1 ? disabled : idle}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} className="px-1 text-surface-400 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btnBase} ${p === page
              ? 'bg-primary-600 text-white shadow-sm'
              : idle}`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="next"
        className={`${btnBase} ${page >= totalPages ? disabled : idle}`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
