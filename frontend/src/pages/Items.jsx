import React, { useEffect, useState, useCallback } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

const PAGE_SIZE = 100;
const ROW_HEIGHT = 44;
const LIST_HEIGHT = 600;

function Items() {
  const { items, meta, fetchItems } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadItems = useCallback(
    (signal) => fetchItems({ page, pageSize: PAGE_SIZE, q: search }, signal),
    [fetchItems, page, search]
  );

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

  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', padding: '0 8px', borderBottom: '1px solid #eee' }}>
        <Link to={'/items/' + item.id}>{item.name} — ${item.price}</Link>
      </div>
    );
  };

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
        <List
          height={Math.min(LIST_HEIGHT, items.length * ROW_HEIGHT)}
          itemCount={items.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {Row}
        </List>
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
