
import axios from 'axios';
import useSWR from 'swr';
import { useAuth } from '../context/AuthContext';
import OfferThread from './OfferThread';

export default function OffersPanel({ listing }) {
  const { token, API_URL, user } = useAuth();

  const fetcher = (url) =>
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);

  const isOwner = user && String(listing.userId) === String(user.id);

  const key = isOwner
    ? `${API_URL}/trade-offers/listing/${listing._id}`
    : `${API_URL}/trade-offers/mine?listingId=${listing._id}`;

  const { data, isLoading, error } = useSWR(token ? key : null, fetcher);

  const offers = isOwner ? (data?.offers || []) : (data?.offers || []);

  return (
    <div className="mt-6 bg-white border rounded p-4">
      <h3 className="font-semibold mb-3">Trade Offers</h3>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading offers…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load offers</p>
      ) : offers.length === 0 ? (
               <p className="text-sm text-gray-500">No offers yet.</p>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <OfferThread key={offer._id} offerId={offer._id} />
          ))}
        </div>
      )}
    </div>
  );
}