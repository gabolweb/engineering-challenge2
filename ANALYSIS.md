# Engineering Challenge — Technical Decisions & Implementation

## Overview

This document details the issues identified, solutions applied, and the reasoning behind each technical decision.

---

## 1. Memory Leak — `Items.jsx` / `DataContext.jsx`

**Problem:** `fetchItems()` in `DataContext` called `setItems()` regardless of whether the consuming component (`Items`) was still mounted. The `active` flag in `Items.jsx` was declared but ineffective — it lived in the wrong scope.

**Solution:** `AbortController` with `signal` passed through `fetchItems`.

```jsx
// DataContext.jsx — accepts signal
const fetchItems = useCallback(async (params, signal) => {
  const res = await fetch(`${apiConfig.baseUrl}/items?${params}`, { signal });
  // ...
}, []);

// Items.jsx — creates controller per effect cycle
useEffect(() => {
  const controller = new AbortController();
  loadItems(controller.signal)/*...*/;
  return () => controller.abort();
}, [loadItems, search]);
```

**Why AbortController over guard flags:** Cancels the HTTP request at the network level, preventing wasted bandwidth. Each consumer creates its own controller, so aborting in `Items` doesn't affect other Context consumers. Same pattern applied to `ItemDetail.jsx`.

---

## 2. Pagination & Server-Side Search

**Problem:** Backend had `q` and `limit` but no real pagination (`page`/`offset`). Frontend fetched all 500+ items without search or page controls.

**Solution:** Offset-based pagination with `{ data, meta }` response envelope.

**Backend** (`items.js`):
- Added `page` and `pageSize` query params with input clamping (`pageSize` capped at 200)
- Response: `{ data: [...], meta: { total, page, pageSize, totalPages } }`
- `q` param filters by `name` (case-insensitive)

**Frontend** (`Items.jsx` + `DataContext.jsx`):
- `DataContext.fetchItems` accepts `{ page, pageSize, q }` params
- Search input with 300ms debounce via `setTimeout` + `AbortController` cleanup
- Pagination controls with ellipsis for large page counts
- Page resets to 1 on new search query
- Predictive search suggestions dropdown with keyboard navigation (ArrowUp/Down/Enter/Escape)

**Why offset-based over cursor-based:** The data source is a JSON file, not a database with mutation-heavy workloads. Offset pagination is natural for `Array.slice()`, simpler to implement, and provides random page access. Cursor-based would be over-engineering.

**Breaking change handled:** Response contract changed from raw array to `{ data, meta }`. Updated `DataContext` to `setItems(json.data)` and added `meta` state.

---

## 3. List Virtualization — `react-window`

**Problem:** `items.map()` rendered all DOM nodes. With 500+ items, this creates unnecessary DOM pressure.

**Solution:** `react-window` v2 with `List` component.

- `FixedSizeList` with `ROW_HEIGHT=72`, `LIST_HEIGHT=600`
- `ItemRow` as `forwardRef` component for react-window v2 API compatibility
- `PAGE_SIZE=100` to have enough items to justify virtualization alongside pagination

**Why `react-window` over `@tanstack/react-virtual`:** README explicitly suggests `react-window`. It's ~6KB gzipped, purpose-built, and lower boilerplate than headless alternatives.

---

## 4. Blocking I/O — `fs.readFileSync` / `fs.writeFileSync`

**Problem:** `readFileSync` and `writeFileSync` block Node.js event loop on every request.

**Solution:** Replaced with `fs/promises` (`readFile` / `writeFile`) + `async/await`.

```js
const fs = require('fs/promises');

async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}
```

All route handlers converted to `async` with `try/catch` and `next(err)`.

---

## 5. Stats Caching — `stats.js`

**Problems found:**
1. **Path bug (critical):** `path.join(__dirname, '../../data/items.json')` resolved to `backend/data/items.json` (doesn't exist). Fixed to `../../../data/items.json`.
2. **No caching:** Stats recalculated on every request.
3. **`utils/stats.js` unused:** `mean()` utility existed but was never imported.

**Solution:** Cache-aside pattern with explicit invalidation.

- `cachedStats` variable with `invalidateCache()` export
- `items.js` POST handler calls `invalidateCache()` after write — deterministic, no reliance on `fs.watch`
- `mean()` from `utils/stats.js` used for `averagePrice` calculation
- Eager-load on startup via `computeStats().catch(console.error)`

**Why not `fs.watch`:** Inconsistent behavior across OS (inotify vs kqueue), fires duplicate events, fails on Docker/network filesystems. Explicit invalidation is deterministic and testable.

---

## 6. Additional Bugs Fixed (Not in README)

| Bug | Location | Fix |
|-----|----------|-----|
| CORS misconfigured | `backend/src/index.js` — origin was `localhost:4001` (self) | Changed to `localhost:3000` (frontend) |
| URL hardcoded in DataContext | `DataContext.jsx` — `fetch('http://localhost:4001/...')` | Uses `appConfig.baseUrl` (`/api`) via Vite proxy |
| `kill-port` anti-pattern | `backend/src/index.js` — killed port 4001 on startup | Removed entirely; graceful shutdown already handles port release |
| POST without validation | `items.js` — accepted any payload | Added `name`, `category`, `price` validation with 400 response |
| `appConfig.js` unused | No component imported it | Now used in `DataContext.jsx` and `ItemDetail.jsx` |
| Memory leak in `ItemDetail.jsx` | Same pattern as `Items.jsx` | `AbortController` with abort on unmount |
| Unused backend deps | `axios`, `request`, `sqlite3`, `dotenv`, `kill-port` | Removed from `package.json` |
| Unused frontend deps | `axios`, `react-scripts` in frontend | Removed; test script updated to `vitest run` |

---

## 7. UI/UX Enhancements (Optional)

- **Tailwind CSS** integration with custom design tokens
- **Skeleton loading states** for list and detail views
- **Empty state** with search guidance
- **Glass morphism navbar** with sticky positioning
- **Animations** via CSS (`animate-fade-in`, `animate-slide-up`)
- **Accessibility:** ARIA labels, `role="combobox"` on search, keyboard navigation for suggestions, `aria-current="page"` on pagination
- **Predictive search** with dropdown suggestions, category badges, and price preview

---

## 8. Test Coverage

### Unit Tests — `utils/stats.test.js`
- `mean()` with multiple values, single element, decimals, negatives, empty array, large numbers

### Integration Tests — `routes/items.test.js`
- `GET /api/items` — paginated envelope `{ data, meta }`
- Page/pageSize params respected
- Second page returns different items (offset works)
- Page beyond total returns empty `data` with correct `meta.total`
- Search query filters correctly
- Non-matching search returns empty
- Search + pagination combined
- `pageSize` capped at 200
- `GET /api/items/:id` — returns item, 404 for non-existent
- `GET /api/stats` — returns `total` and `averagePrice`

**17 tests, all passing.**

---

## Architecture Decisions Summary

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Pagination | Offset-based | Cursor-based, GraphQL | JSON file source, random page access needed |
| Virtualization | `react-window` | `react-virtualized`, `@tanstack/react-virtual` | README suggestion, minimal bundle, low boilerplate |
| Cache invalidation | Explicit `invalidateCache()` | `fs.watch`, TTL | Deterministic, cross-OS compatible, testable |
| Memory leak fix | `AbortController` + `signal` | Guard flags, move fetch to component | Cancels at network level, preserves Context architecture |
| Async I/O | `fs/promises` | Callbacks, streams | Modern Node.js idiom, consistent with async/await |
| Search UX | Debounce 300ms + predictive suggestions | Instant search, search button | Balances responsiveness with request efficiency |
| API URL | `appConfig.baseUrl` via Vite proxy | Hardcoded `localhost:4001` | Environment-agnostic, no CORS issues |
