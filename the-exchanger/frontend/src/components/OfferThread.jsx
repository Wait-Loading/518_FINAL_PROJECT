import { useReducer, useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, X, MessageSquare, Cloud, MapPin } from 'lucide-react';
import MeetupWeather from '../components/WeatherWidget';

/** Normalize URLs */
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

//  ADVANCED FEATURE: useReducer for complex UI state management
const initialState = {
  messageText: '',
  isBusy: false,
  error: '',
  showWeather: false,
  filterMessages: 'all', // 'all', 'mine', 'theirs'
};

function offerUIReducer(state, action) {
  switch (action.type) {
    case 'SET_MESSAGE_TEXT':
      return { ...state, messageText: action.payload };
    
    case 'SET_BUSY':
      return { ...state, isBusy: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isBusy: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: '' };
    
    case 'TOGGLE_WEATHER':
      return { ...state, showWeather: !state.showWeather };
    
    case 'SET_FILTER':
      return { ...state, filterMessages: action.payload };
    
    case 'CLEAR_MESSAGE':
      return { ...state, messageText: '', error: '' };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

export default function OfferThread({ offerId }) {
  const { token, API_URL, user } = useAuth();
  
  // ✨ Using useReducer instead of multiple useState calls
  const [state, dispatch] = useReducer(offerUIReducer, initialState);

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
    if (!state.messageText.trim()) return;
    dispatch({ type: 'SET_BUSY', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      await axios.post(
        `${API_URL}/trade-offers/${offer._id}/messages`,
        { text: state.messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch({ type: 'CLEAR_MESSAGE' });
      await mutate();
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to send message' });
    } finally {
      dispatch({ type: 'SET_BUSY', payload: false });
    }
  };

  const accept = async () => {
    dispatch({ type: 'SET_BUSY', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      await axios.post(`${API_URL}/trade-offers/${offer._id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await mutate();
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to accept' });
    } finally {
      dispatch({ type: 'SET_BUSY', payload: false });
    }
  };

  const decline = async () => {
    dispatch({ type: 'SET_BUSY', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      await axios.post(`${API_URL}/trade-offers/${offer._id}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await mutate();
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to decline' });
    } finally {
      dispatch({ type: 'SET_BUSY', payload: false });
    }
  };

  const mark = async (status) => {
    dispatch({ type: 'SET_BUSY', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      await axios.post(
        `${API_URL}/trade-offers/${offer._id}/mark`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await mutate();
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to update status' });
    } finally {
      dispatch({ type: 'SET_BUSY', payload: false });
    }
  };

  const offeredItems = Array.isArray(offer.offeredItems) ? offer.offeredItems : [];
  const offeredCount = offeredItems.length;

  // Filter messages based on selected filter
  const allMessages = offer.messages || [];
  const filteredMessages = allMessages.filter((m) => {
    if (state.filterMessages === 'all') return true;
    if (state.filterMessages === 'mine') return String(m.senderId) === String(user?.id);
    if (state.filterMessages === 'theirs') return String(m.senderId) !== String(user?.id);
    return true;
  });

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

      {/* Offered items */}
      <div className="mt-3">
        <div className="text-sm text-gray-700 mb-2">
          <b>Offered items:</b> {offeredCount}
        </div>

        {offeredCount === 0 ? (
          <div className="text-sm text-gray-500">No items were offered.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {offeredItems.map((itemOrId) => {
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

      {/* ✨ EXTERNAL API: Weather widget for meetup planning */}
      {(offer.status === 'accepted' || offer.status === 'completed') && (
        <div className="mt-3">
          {state.showWeather ? (
            <MeetupWeather showInline={true} />
          ) : (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_WEATHER' })}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Cloud size={16} />
              Check weather for meetup
            </button>
          )}
        </div>
      )}

      {/* Message filter - shows useReducer managing complex state */}
      <div className="mt-4 flex gap-2 text-xs">
        <button
          onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}
          className={`px-2 py-1 rounded ${
            state.filterMessages === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All ({allMessages.length})
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_FILTER', payload: 'mine' })}
          className={`px-2 py-1 rounded ${
            state.filterMessages === 'mine' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          My Messages
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_FILTER', payload: 'theirs' })}
          className={`px-2 py-1 rounded ${
            state.filterMessages === 'theirs' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Their Messages
        </button>
      </div>

      {/* Messages */}
      <div className="mt-3 space-y-2">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading thread…</p>
        ) : filteredMessages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages to show</p>
        ) : (
          filteredMessages.map((m) => (
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
          ))
        )}
      </div>

      {/* Compose */}
      <div className="mt-3 flex gap-2">
        <input
          value={state.messageText}
          onChange={(e) => dispatch({ type: 'SET_MESSAGE_TEXT', payload: e.target.value })}
          placeholder="Type a message…"
          className="flex-1 border rounded px-3 py-2"
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={state.isBusy || !state.messageText.trim()}
          className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-60 inline-flex items-center gap-1"
        >
          <MessageSquare size={16} /> Send
        </button>
      </div>

      {state.error && <div className="mt-2 text-red-600 text-sm">{state.error}</div>}

      {/* Owner actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {isOwner && offer.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={accept}
              disabled={state.isBusy}
              className="bg-green-600 text-white px-3 py-2 rounded inline-flex items-center gap-1 disabled:opacity-60"
            >
              <Check size={16} /> Accept
            </button>
            <button
              type="button"
              onClick={decline}
              disabled={state.isBusy}
              className="bg-red-600 text-white px-3 py-2 rounded inline-flex items-center gap-1 disabled:opacity-60"
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
              disabled={state.isBusy}
              className="bg-purple-600 text-white px-3 py-2 rounded disabled:opacity-60"
            >
              Mark Completed
            </button>
            <button
              type="button"
              onClick={() => mark('pending')}
              disabled={state.isBusy}
              className="bg-yellow-600 text-white px-3 py-2 rounded disabled:opacity-60"
            >
              Back to Pending
            </button>
          </>
        )}
      </div>
    </div>
  );
}