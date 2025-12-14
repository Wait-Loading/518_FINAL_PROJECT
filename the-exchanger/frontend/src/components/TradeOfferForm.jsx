
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import useSWR from 'swr';

export default function TradeOfferForm({ listing }) {
  const { token, API_URL } = useAuth();
  const [offeredItems, setOfferedItems] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetcher = (url) =>
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
         .then(res => res.data);

  const { data, isLoading } = useSWR(
    token ? `${API_URL}/users/me/listings` : null,
    fetcher
  );

  const myListings = (data?.listings || []).filter(
    (item) => item._id !== listing._id && item.status === 'available'
  );

  const toggleOffer = (id) => {
    setOfferedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/trade-offers`, // ✅ create endpoint
        {
          listingId: listing._id,
          offeredItems,
          message,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Trade offer sent!');
      setOfferedItems([]);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send trade offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitOffer} className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
      <h3 className="font-semibold mb-2">Make a Trade Offer</h3>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="mb-3">
        <label className="block mb-1">Select your items to offer:</label>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading your items…</p>
        ) : myListings.length === 0 ? (
          <p className="text-sm text-gray-500">You have no available items to offer.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {myListings.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => toggleOffer(item._id)}
                className={`px-3 py-1 border rounded ${
                  offeredItems.includes(item._id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-100'
                }`}
                title={item.description}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>

           <div className="mb-3">
        <label className="block mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
          placeholder="Optional message…"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send Offer'}
      </button>
    </form>
  );
}