
// src/components/CreateListing.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSWRConfig } from 'swr';
import { PlusCircle } from 'lucide-react';

const CATEGORIES = [
  'electronics', 'fashion', 'home', 'books', 'toys',
  'services', 'vehicles', 'sports', 'other'
];

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];

export default function CreateListing() {
  const { token, API_URL, user } = useAuth();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState(user?.location || '');
  const [images, setImages] = useState(['']);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onChangeImage = (idx, val) => {
    const next = [...images];
    next[idx] = val;
    setImages(next);
  };

  const addImageField = () => setImages((arr) => [...arr, '']);
  const removeImageField = (idx) =>
    setImages((arr) => arr.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        category,
        condition: condition || undefined,
        images: images.filter(Boolean),
        location,
        status: 'available',
      };

      await axios.post(`${API_URL}/listings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Invalidate all /listings keys so Browse updates
      await mutate(
        (key) => typeof key === 'string' && key.startsWith(`${API_URL}/listings`),
        undefined,
        { revalidate: true }
      );

      navigate('/my-listings'); // or navigate('/browse')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <PlusCircle />
        Create Listing
      </h1>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white shadow rounded p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Nintendo Switch for trade"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Description</label>
          <textarea
            rows={4}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Condition, accessories, what you want in exchange, etc."
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Condition</label>
            <select
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="">Select</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Location</label>
          <input
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State"
          />
        </div>

        {/* Image URL fields */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Image URLs</label>
          <div className="space-y-2">
            {images.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                  value={url}
                  onChange={(e) => onChangeImage(idx, e.target.value)}
                  placeholder="https://…"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => removeImageField(idx)}
                  disabled={images.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-blue-600 hover:underline"
            onClick={addImageField}
          >
            + Add another image
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}