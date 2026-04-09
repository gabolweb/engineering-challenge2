import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiConfig } from '../config/appConfig';

function SkeletonDetail() {
  return (
    <div className="animate-fade-in">
      <div className="skeleton h-4 w-28 rounded-lg mb-8" />
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-card p-8">
        <div className="skeleton h-5 w-20 rounded-full mb-4" />
        <div className="skeleton h-8 w-64 rounded-xl mb-2" />
        <div className="skeleton h-4 w-32 rounded-lg mb-8" />
        <div className="border-t border-neutral-100 pt-6 mt-6 grid grid-cols-2 gap-6">
          <div>
            <div className="skeleton h-3 w-16 rounded mb-2" />
            <div className="skeleton h-6 w-24 rounded-lg" />
          </div>
          <div>
            <div className="skeleton h-3 w-16 rounded mb-2" />
            <div className="skeleton h-6 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiConfig.baseUrl}/items/${id}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setItem(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setLoading(false);
          navigate('/');
        }
      });

    return () => controller.abort();
  }, [id, navigate]);

  if (loading) return <SkeletonDetail />;

  if (!item) return null;

  const CATEGORY_COLORS = {
    Electronics: { bg: 'bg-blue-50', text: 'text-blue-600' },
    Audio: { bg: 'bg-violet-50', text: 'text-violet-600' },
    Furniture: { bg: 'bg-amber-50', text: 'text-amber-600' },
    Accessories: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  };
  const cat = CATEGORY_COLORS[item.category] || { bg: 'bg-neutral-50', text: 'text-neutral-600' };

  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400
                   hover:text-neutral-900 transition-colors duration-200 mb-8 group"
      >
        <svg
          className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to products
      </Link>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-glass-lg p-8 animate-slide-up">
        {/* Category badge */}
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${cat.bg} ${cat.text} mb-4`}>
          {item.category}
        </span>

        {/* Name */}
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">
          {item.name}
        </h1>

        <p className="text-xs text-neutral-400 font-medium mb-6">
          Product ID: #{item.id}
        </p>

        {/* Details */}
        <div className="border-t border-neutral-100 pt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">
              Category
            </p>
            <p className="text-sm font-semibold text-neutral-900">
              {item.category}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">
              Price
            </p>
            <p className="text-2xl font-bold text-neutral-900 tabular-nums">
              ${item.price}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
