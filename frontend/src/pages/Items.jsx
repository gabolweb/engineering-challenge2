import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { List } from 'react-window';

const PAGE_SIZE = 100;
const ROW_HEIGHT = 72;
const LIST_HEIGHT = 600;

const CATEGORY_STYLE = {
  Electronics: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  Audio: { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
  Furniture: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  Accessories: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  Office: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' },
  Storage: { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-400' },
};

function getCatStyle(category) {
  return CATEGORY_STYLE[category] || { bg: 'bg-neutral-50', text: 'text-neutral-600', dot: 'bg-neutral-400' };
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function SkeletonRows() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-card">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 h-[72px] border-b border-neutral-50 last:border-b-0">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-4 w-40 rounded-lg flex-1" />
          <div className="skeleton h-4 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

const ItemRow = React.forwardRef(function ItemRow({ index, style, items, ariaAttributes, ...rest }, ref) {
  const item = items[index];
  if (!item) return null;
  const cat = getCatStyle(item.category);

  return (
    <div ref={ref} style={style} {...ariaAttributes} {...rest}>
      <Link
        to={`/items/${item.id}`}
        className="flex items-center gap-4 px-5 h-full
                   border-b border-neutral-50
                   transition-colors duration-150
                   hover:bg-neutral-50/80
                   focus:outline-none focus-visible:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900/10"
      >
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${cat.bg} ${cat.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
          {item.category}
        </span>

        <span className="text-sm font-medium text-neutral-900 truncate flex-1 min-w-0">
          {item.name}
        </span>

        <span className="text-sm font-bold text-neutral-900 tabular-nums shrink-0">
          ${item.price}
        </span>

        <svg className="w-4 h-4 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </div>
  );
});

function Items() {
  const { items, meta, fetchItems } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = React.useRef(null);

  const loadItems = useCallback(
    (signal) => {
      setLoading(true);
      return fetchItems({ page, pageSize: PAGE_SIZE, q: search }, signal)
        .finally(() => setLoading(false));
    },
    [fetchItems, page, search]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsTyping(false);
      loadItems(controller.signal).catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    }, search ? 300 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadItems, search]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setIsTyping(true);
    setActiveSuggestion(-1);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Predictive suggestions
  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/items?q=${encodeURIComponent(search)}&pageSize=5`, { signal: controller.signal })
        .then(res => res.json())
        .then(json => {
          setSuggestions(json.data || []);
          setShowSuggestions(true);
        })
        .catch(() => {});
    }, 150);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [search]);

  const handleSuggestionClick = (item) => {
    setShowSuggestions(false);
    setSearch(item.name);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const listHeight = Math.min(LIST_HEIGHT, items.length * ROW_HEIGHT);

  const rowProps = useMemo(() => ({ items }), [items]);

  const pageNumbers = useMemo(() => {
    const total = meta.totalPages || 0;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push(null, total);
    } else if (page >= total - 3) {
      pages.push(1, null);
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1, null, page - 1, page, page + 1, null, total);
    }
    return pages;
  }, [page, meta.totalPages]);

  const showSkeleton = loading && items.length === 0;
  const showLoader = loading && items.length > 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-1">
          Products
        </h1>
        <p className="text-sm text-neutral-400 font-medium">
          {loading
            ? 'Loading...'
            : `${meta.total || 0} item${(meta.total || 0) !== 1 ? 's' : ''} available`
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8" ref={searchRef}>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="search-input pl-11 w-full"
          aria-label="Search products"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          role="combobox"
        />
        {(isTyping || showLoader) && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <div
              className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"
              role="status"
              aria-label="Searching"
            />
          </div>
        )}

        {/* Predictive suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            className="absolute z-50 top-full left-0 right-0 mt-1
                       bg-white rounded-xl border border-neutral-100
                       shadow-lg overflow-hidden"
          >
            {suggestions.map((item, i) => (
              <li
                key={item.id}
                role="option"
                aria-selected={i === activeSuggestion}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm
                           transition-colors duration-100
                           ${i === activeSuggestion ? 'bg-neutral-50' : 'hover:bg-neutral-50/60'}
                           ${i < suggestions.length - 1 ? 'border-b border-neutral-50' : ''}`}
                onMouseDown={() => handleSuggestionClick(item)}
                onMouseEnter={() => setActiveSuggestion(i)}
              >
                <SearchIcon />
                <span className="font-medium text-neutral-900 truncate flex-1">{item.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getCatStyle(item.category).bg} ${getCatStyle(item.category).text}`}>
                  {item.category}
                </span>
                <span className="text-xs font-semibold text-neutral-500 tabular-nums">${item.price}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Skeleton */}
      {showSkeleton && <SkeletonRows />}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-neutral-900 mb-1">No results found</p>
          <p className="text-xs text-neutral-400">Try adjusting your search to find what you're looking for.</p>
        </div>
      )}

      {/* Virtualized list */}
      {items.length > 0 && (
        <div className={`rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-card
                         transition-opacity duration-300 ${showLoader ? 'opacity-60' : ''}`}>
          <List
            defaultHeight={listHeight}
            rowCount={items.length}
            rowHeight={ROW_HEIGHT}
            rowComponent={ItemRow}
            rowProps={rowProps}
          />
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-10 animate-fade-in">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-page-default"
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {pageNumbers.map((num, i) =>
            num === null ? (
              <span key={`ellipsis-${i}`} className="px-1 text-neutral-300 text-sm select-none">
                &hellip;
              </span>
            ) : (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={num === page ? 'btn-page-active' : 'btn-page-default'}
                aria-label={`Page ${num}`}
                aria-current={num === page ? 'page' : undefined}
              >
                {num}
              </button>
            )
          )}

          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn-page-default"
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default Items;
