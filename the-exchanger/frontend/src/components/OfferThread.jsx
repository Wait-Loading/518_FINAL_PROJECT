
import { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, X, MessageSquare } from 'lucide-react';

/** Normalize URLs: http(s)/blob/data → return as-is; relative → prefix API_URL */
const toAbsoluteUrl = (API_URL, p) => {
  if (!p) return '';
  let url = p;
  if (typeof p === 'object' && p.url) url = p.url;
  if (typeof url !== 'string') return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  try {
    const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
    return new URL(String(url).replace(/^\//, ''), base).href;
  } catch {
    const api = API_URL.replace(/\/$/, '');
    const rel = String(url).replace(/^\//, '');
    return `${api}/${rel}`;
  }
};

export default function OfferThread({ offerId }) {
  const { token, API_URL, user } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const fetcher = (url) =>
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);

  const { data, mutate, isLoading } = useSWR(
    token ? `${API_URL}/trade-offers/${offerId}` : null,
    fetcher
  );

  const offer = data?.offer;
  if (!offer) return null;

  const isOwner = user && String(offer.toUserId) === String(user.id);
  const isProposer = user && String(offer.fromUserId) === String(user.id);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await axios.post(
        `${API_URL}/trade-offers/${offer._id}/messages`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setText('');
      await mutate();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    setBusy(true); setErr('');
    try {
      await axios.post(`${API_URL}/trade-offers/${offer._id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await mutate();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to accept');
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true); setErr('');
    try {
      await axios.post(`${API_URL}/trade-offers/${offer._id}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await mutate();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to decline');
    } finally {
      setBusy(false);
    }
  };

  const mark = async (status) => {
    setBusy(true); setErr('');
    try {
      await axios.post(
        `${API_URL}/trade-offers/${offer._id}/mark`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } } // ✅ fixed header
      );
      await mutate();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  /** Offered items: populated docs OR IDs (fallback). */
  const offeredItems = Array.isArray(offer.offeredItems) ? offer.offeredItems : [];
  const offeredCount = offeredItems.length;

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">
          Offer by {isProposer ? 'you' : 'user'}
        </div>
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
          {offer.status}
        </span>
      </div>

      {/* Offered items — clickable previews redirect to listing details */}
      <div className="mt-3">
        <div className="text-sm text-gray-700 mb-2">
          <b>Offered items:</b> {offeredCount}
        </div>

        {offeredCount === 0 ? (
          <div className="text-sm text-gray-500">No items were offered.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {offeredItems.map((itemOrId) => {
              // If populated listing doc → use fields; else treat as ID
              const isDoc = typeof itemOrId === 'object' && itemOrId && itemOrId._id;
              const id = isDoc ? itemOrId._id : itemOrId;
              const title = isDoc ? itemOrId.title : 'View listing';
              const status = isDoc ? itemOrId.status : '';
              const imgSrc = isDoc && Array.isArray(itemOrId.images) && itemOrId.images[0]
                ? toAbsoluteUrl(API_URL, itemOrId.images[0])
                : null;

              return (
                <Link
                  key={id}
                  to={`/listings/${id}`}
                  className="border rounded hover:shadow-sm transition overflow-hidden"
                  title={title}
                >
                  <div className="h-28 bg-gray-100">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {/* Show placeholder when not populated or no image */}
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium line-clamp-1">{title}</div>
                      {status && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading thread…</p>
        ) : (offer.messages || []).map((m) => (
          <div
            key={m._id || m.createdAt}
            className={`p-2 rounded text-sm ${
              String(m.senderId) === String(user?.id) ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <div className="text-gray-800">{m.text}</div>
            <div className="text-xs text-gray-500">
              {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={busy || !text.trim()}
          className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-60 inline-flex items-center gap-1"
        >
          <MessageSquare size={16} /> Send
        </button>
      </div>

      {err && <div className="mt-2 text-red-600 text-sm">{err}</div>}

      {/* Owner actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {isOwner && offer.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={accept}
              className="bg-green-600 text-white px-3 py-2 rounded inline-flex items-center gap-1"
            >
              <Check size={16} /> Accept
            </button>
            <button
              type="button"
              onClick={decline}
              className="bg-red-600 text-white px-3 py-2 rounded inline-flex items-center gap-1"
            >
              <X size={16} /> Decline
            </button>
          </>
        )}

        {isOwner && offer.status === 'accepted' && (
          <>
            <button
              type="button"
              onClick={() => mark('completed')}
              className="bg-purple-600 text-white px-3 py-2 rounded"
            >
              Mark Completed (Traded)
            </button>
            <button
              type="button"
              onClick={() => mark('pending')}
              className="bg-yellow-600 text-white px-3 py-2 rounded"
            >
              Back to Pending
            </button>
            <button
              type="button"
              onClick={() => mark('available')}
              className="bg-gray-600 text-white px-3 py-2 rounded"
            >
              Revert to Available
                       </button>
          </>
        )}
      </div>
    </div>
  );
}