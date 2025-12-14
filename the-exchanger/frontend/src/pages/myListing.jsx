
import useSWR from 'swr';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const fetcherAuth = (url, token) =>
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
       .then((res) => res.data);

// Robust URL normalizer
const toAbsoluteUrl = (API_URL, p) => {
  if (!p) return '';
  let url = p;
  if (typeof p === 'object' && p.url) url = p.url;
  if (typeof url !== 'string') return '';

  // Already absolute
  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  // Relative -> prefix API_URL
  try {
    const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
    return new URL(String(url).replace(/^\//, ''), base).href;
  } catch {
    const api = API_URL.replace(/\/$/, '');
    const rel = String(url).replace(/^\//, '');
    return `${api}/${rel}`;
  }
};

export default function MyListings() {
  const { token, API_URL } = useAuth();
  const key = token ? `${API_URL}/users/me/listings` : null;
  const { data, error, isLoading } = useSWR(key, (url) => fetcherAuth(url, token));

  const listings = data?.listings || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Items</h1>
        <Link
          to="/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create Listing
        </Link>
      </div>

      {isLoading && <div className="text-gray-600">Loading…</div>}
      {error && <div className="text-red-600">Failed to load your items.</div>}
      {!isLoading && listings.length === 0 && (
        <div className="text-gray-600">You don’t have any listings yet.</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((l) => {
          const thumb = l.images?.[0]
            ? toAbsoluteUrl(API_URL, l.images[0])
            : null;

          return (
            <Link key={l._id} to={`/listings/${l._id}`} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="h-40 bg-gray-100">
                {thumb ? (
                  <img src={thumb} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{l.title}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{l.status}</span>
                </div>
                <p className="text-gray-600 line-clamp-2">{l.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
``
