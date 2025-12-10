// src/pages/ListingDetailsPage.jsx
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import axios from 'axios';
import TradeOfferForm from './TradeOfferForm';

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
  const isOwner = user?.id === listing.userId;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{listing.title}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {listing.images?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {listing.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Listing image ${idx + 1}`}
                  className="w-full h-48 md:h-56 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
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
              <span className="font-semibold">Condition:</span> {listing.condition}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Location:</span> {listing.location}
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
          {!isOwner && listing.status === 'available' && (
            <div className="mt-6">
              <TradeOfferForm listing={listing} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
