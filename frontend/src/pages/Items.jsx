import React, { useEffect, useState, useCallback } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, meta, fetchItems } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadItems = useCallback(
    (signal) => fetchItems({ page, q: search }, signal),
    [fetchItems, page, search]
  );

  // Debounce search: reset page on query change
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadItems(controller.signal).catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    }, search ? 300 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadItems, search]);

  return (
    <div style={{ padding: 16 }}>
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: 8, marginBottom: 16, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}
      />

      {!items.length ? (
        <p>{search ? 'No results found.' : 'Loading...'}</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id}>
              <Link to={'/items/' + item.id}>{item.name} — ${item.price}</Link>
            </li>
          ))}
        </ul>
      )}

      {meta.totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Items;
