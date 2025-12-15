
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSWR from 'swr';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'electronics', 'fashion', 'home', 'books', 'toys',
  'services', 'vehicles', 'sports', 'other'
];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];
const STATUSES = ['available', 'pending', 'traded'];

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, API_URL, user } = useAuth();

  const fetcher = (url) =>
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

  const { data, error, isLoading } = useSWR(`${API_URL}/listings/${id}`, fetcher);

  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('available');
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (data?.listing) {
      const l = data.listing;
      if (String(l.userId) !== String(user?.id)) {
        setErr('You are not authorized to edit this item.');
        return;
      }
      setTitle(l.title || '');
      setDesc(l.description || '');
      setCategory(l.category || '');
      setCondition(l.condition || '');
      setLocation(l.location || '');
      setStatus(l.status || 'available');
      setImages(Array.isArray(l.images) ? l.images : []);
    }
  }, [data, user]);

  const addImageUrl = () => {
    const u = imageUrlInput.trim();
    if (!u) return;
    setImages((prev) => [...prev, u]);
    setImageUrlInput('');
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

const onDelete = async () => {
  // Confirm first (optional)
  const ok = window.confirm('Are you sure you want to delete this listing? This cannot be undone.');
  if (!ok) return;

  setSaving(true);
  setErr('');

  try {
    await axios.delete(`${API_URL}/listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // After delete, send user either to their listings or home
    navigate('/my-listings'); // adjust to your route, e.g. '/listings' or '/'
  } catch (e) {
    setErr(e.response?.data?.message || 'Failed to delete listing');
  } finally {
    setSaving(false);
  }
};

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');

    try {
      await axios.patch(
        `${API_URL}/listings/${id}`,
        {
          title,
          description,
          category,
          condition: condition || undefined,
          location,
          status,
          images,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Go back to details page
      navigate(`/listings/${id}`);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load listing.</div>;
  if (!data?.listing) return <div className="p-6">Listing not found.</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>

      <form onSubmit={onSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <input
          required
          placeholder="Title"
          className="w-full border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          required
          rows={4}
          placeholder="Description"
          className="w-full border p-2 rounded"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
        />

        <select
          required
          className="w-full border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="w-full border p-2 rounded"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="">Select condition</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          placeholder="Location"
          className="w-full border p-2 rounded"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <select
          required
          className="w-full border p-2 rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Image URLs editor */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 border p-2 rounded"
              placeholder="https://image-url..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
            />
            <button type="button" onClick={addImageUrl} className="bg-gray-200 px-3 rounded">
              Add
            </button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={`img-${i}`} className="relative">
                  <img src={url} alt={`img-${i}`} className="w-full h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white px-1 rounded text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-60"
        >
                   {saving ? 'Saving…' : 'Save Changes'}
        </button>
        
<button
  type="button"
  onClick={onDelete}
  disabled={saving}
  className="w-full bg-red-600 text-white py-2 rounded disabled:opacity-60 mt-2"
>
    {saving ? 'Deleting…' : 'Delete Listing'}
</button>
      </form>
    </div>
  );
}