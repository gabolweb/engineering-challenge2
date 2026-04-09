import React, { createContext, useCallback, useContext, useState } from 'react';
import { apiConfig } from '../config/appConfig';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 0 });

  const fetchItems = useCallback(async ({ page = 1, pageSize = 20, q = '' } = {}, signal) => {
    const params = new URLSearchParams({ page, pageSize });
    if (q) params.set('q', q);

    const res = await fetch(`${apiConfig.baseUrl}/items?${params}`, { signal });
    const json = await res.json();
    setItems(json.data);
    setMeta(json.meta);
  }, []);

  return (
    <DataContext.Provider value={{ items, meta, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
