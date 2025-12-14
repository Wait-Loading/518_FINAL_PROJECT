
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import axios from 'axios';
import TradeOfferForm from '../components/TradeOfferForm';
import OffersPanel from '../components/OfferPanel'; // change to '../components/OffersPanel' if that's your filename

export default function ListingDetailsPage() {
  const { id } = useParams();
  const { token, API_URL, user } = useAuth();

  const fetcher = (url) =>
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

  const { data, error, isLoading } = useSWR(`${API_URL}/listings/${id}`, fetcher);

  if (isLoading) return <p className="text-center text-gray-500 mt-20">Loading listing...</p>;
  if (error) return <p className="text-center text-red-500 mt-20">Error loading listing.</p>;
  if (!data?.listing) return <p className="text-center text-gray-500 mt-20">Listing not found.</p>;

  const listing = data.listing;
  const isOwner = String(user?.id) === String(listing.userId);

  // Inline normalization of image URLs (no helper)
  // - If img is absolute (http/https/blob/data) → use as-is
  // - If img is relative → prefix API_URL
  const images = Array.isArray(listing.images)
    ? listing.images.map((img) => {
        let url = typeof img === 'string' ? img : img?.url || '';
        if (!url) return '';
        if (/^(https?:|blob:|data:)/i.test(url)) return url;
        const api = API_URL.replace(/\/$/, '');
        const rel = String(url).replace(/^\//, '');
        return `${api}/${rel}`;
      })
    : [];

  const canEdit = isOwner && listing.status !== 'traded';

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Title + Edit button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{listing.title}</h1>

        {canEdit && (
          <Link
            to={`/listings/${listing._id}/edit`}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Edit Item
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Listing image ${idx + 1}`}
                  className="w-full h-48 md:h-56 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.4';
                    e.currentTarget.alt = 'Image failed to load';
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg shadow-md text-gray-400">
              No images available
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold">Description:</span> {listing.description}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Category:</span> {listing.category}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Condition:</span> {listing.condition || '—'}
                       </p>
            <p className="text-gray-700">
              <span className="font-semibold">Location:</span> {listing.location || '—'}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Status:</span>{' '}
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  listing.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : listing.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {listing.status}
              </span>
            </p>
          </div>

          {/* Trade Offer Form */}
          {!isOwner && listing.status === 'available' && token && (
            <div className="mt-6">
              <TradeOfferForm listing={listing} />
            </div>
          )}
        </div>
      </div>

      {/* Offers & Chat — visible to owner and to any proposer who has offered */}
      {token && <OffersPanel listing={listing} />}
    </div>
  );
}