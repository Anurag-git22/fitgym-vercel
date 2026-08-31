import { Search, X } from 'lucide-react';

/**
 * FilterBar — layout for search, dropdowns, dates, and clear.
 * Filtering stays in the parent (existing data only).
 */
export default function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  children,
  onClear,
  clearDisabled,
}) {
  return (
    <div className="filter-bar">
      {onSearch != null && (
        <div className="table-search-wrap filter-bar-search">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="table-search-input"
          />
        </div>
      )}
      <div className="filter-bar-controls">{children}</div>
      {onClear && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClear}
          disabled={clearDisabled}
        >
          <X size={14} />
          Clear filters
        </button>
      )}
    </div>
  );
}
