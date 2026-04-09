import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Items from './Items';
import ItemDetail from './ItemDetail';
import { DataProvider } from '../state/DataContext';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <DataProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Navbar */}
        <header className="sticky top-0 z-50 glass border-b border-neutral-200/40">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center
                              transition-transform duration-200 group-hover:scale-105">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                  <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                  <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                  <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                Store
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${isHome
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
              >
                Products
              </Link>
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-100 mt-auto">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <p className="text-xs text-neutral-400 font-medium">
              &copy; 2026 Store
            </p>
            <p className="text-xs text-neutral-300">
              Built with care
            </p>
          </div>
        </footer>
      </div>
    </DataProvider>
  );
}

export default App;
