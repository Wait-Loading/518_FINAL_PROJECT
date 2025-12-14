
// src/pages/BrowsePage.jsx
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Tag, Package } from 'lucide-react';

const fetcher = (url) => axios.get(url).then((res) => res.data);

const CATEGORIES = [
  'electronics', 'fashion', 'home', 'books', 'toys',
  'services', 'vehicles', 'sports', 'other',
];

const STATUS = ['available', 'pending', 'traded'];

/**
 * Derive the backend origin from API_URL.
 * - If API_URL = "http://localhost:5000/api" -> origin = "http://localhost:5000"
 * - If API_URL = "http://localhost:5000"     -> origin = "http://localhost:5000"
 */
function getOriginFromApiUrl(API_URL) {
  if (!API_URL || typeof API_URL !== 'string') return '';
  // Remove trailing slash
  let base = API_URL.replace(/\/+$/, '');
  // If ends with /api, strip it to get origin
  base = base.replace(/\/api$/i, '');
  return base;
}

/**
 * Robust normalizer:
 * - Accepts strings or objects { url: string }
 * - Returns absolute URL:
 *    * http(s), blob:, data: -> unchanged
 *    * /api/uploads/... or /uploads/... -> prefix with origin
 *    * other relative -> prefix with origin
 */
function normalizeImageUrl(API_URL, p) {
  if (!p) return '';
  let url = typeof p === 'string' ? p : p?.url || '';
  if (!url || typeof url !== 'string') return '';

  // Already absolute (http/https/blob/data)
  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  // Build absolute from origin
  const origin = getOriginFromApiUrl(API_URL);
  if (!origin) return url; // fallback: return as-is

  const rel = String(url).replace(/^\//, ''); // remove leading slash
  return `${origin}/${rel}`;
}

export default function BrowsePage() {
  const { API_URL } = useAuth();

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (category) p.set('category', category);
    if (status) p.set('status', status);
    if (sort) p.set('sort', sort);
    return p.toString();
  }, [q, category, status, sort]);

  // If API_URL includes /api, this still works because listings is under /api
  const key = `${API_URL}/listings${queryString ? `?${queryString}` : ''}`;
  const { data, error, isLoading } = useSWR(key, fetcher);

  const listings = data?.listings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package />
          Browse Items
        </h1>

        <Link
          to="/create"
          className="hidden md:inline-flex bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items…"
            className="border rounded px-3 py-2"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All status</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-gray-600">Loading listings…</div>
      )}

      {error && (
        <div className="text-center text-red-600">
          Failed to load listings
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="text-center text-gray-600">
          No items found
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((item) => (
          <ListingCard
            key={item._id}
            item={item}
            API_URL={API_URL}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* --------------------------- Listing Card -------------------------- */
/* ------------------------------------------------------------------ */

function ListingCard({ item, API_URL }) {
  const thumb = (() => {
    if (!item.images || item.images.length === 0) return null;
    const first = item.images[0];
    const abs = normalizeImageUrl(API_URL, first);
    return abs || null;
  })();

  const created = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString()
    : '';

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="h-44 bg-gray-100">
        {thumb ? (
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              // Helpful diagnostics while you’re testing paths
              console.warn('Image failed to load:', thumb, 'for item:', item._id, item.title);
              e.currentTarget.style.opacity = '0.4';
              e.currentTarget.alt = 'Image failed to load';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>

        <p className="text-gray-600 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Tag size={16} /> {item.category}
          </span>

          {item.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={16} /> {item.location}
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            <Clock size={16} /> {created}
          </span>
        </div>

        <Link
          to={`/listings/${item._id}`}
          className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          View
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* --------------------------- Status Badge -------------------------- */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  const styles = {
    available: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    traded: 'bg-gray-200 text-gray-700',
  }[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles}`}>
      {status}
    </span>
  );
}