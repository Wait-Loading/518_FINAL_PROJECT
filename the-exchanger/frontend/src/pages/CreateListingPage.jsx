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
  const [status, setStatus] = useState('available');

  // Local file objects (NOT saved directly)
  const [files, setFiles] = useState([]);

  // Image URLs added manually
  const [imageUrls, setImageUrls] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* -------------------- Image handlers -------------------- */

  const onFilesSelected = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageUrls((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeUrl = (idx) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  /* -------------------- Submit -------------------- */

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let uploadedImages = [];

      // 1️⃣ Upload files to backend
      if (files.length > 0) {
        const form = new FormData();
        files.forEach((f) => form.append('images', f));

        const uploadRes = await axios.post(
          `${API_URL}/uploads/listing-images`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        uploadedImages = uploadRes.data.images;
      }

      // 2️⃣ Combine uploaded images + URL images
      const finalImages = [
        ...uploadedImages,
        ...imageUrls
      ];

      // 3️⃣ Create listing
      await axios.post(
        `${API_URL}/listings`,
        {
          title,
          description,
          category,
          condition: condition || undefined,
          location,
          status,
          images: finalImages,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await mutate((key) =>
        typeof key === 'string' && key.includes('/listings')
      );

      navigate('/my');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !user) {
    return (
      <div className="max-w-xl mx-auto p-6 text-gray-700">
        You must be logged in to create a listing.
      </div>
    );
  }

  /* -------------------- UI -------------------- */

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <PlusCircle /> Create Listing
      </h1>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      )}

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

        {/* Image URL input */}
        <div className="flex gap-2">
          <input
            className="flex-1 border p-2 rounded"
            placeholder="https://image-url..."
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
          />
          <button
            type="button"
            onClick={addImageUrl}
            className="bg-gray-200 px-3 rounded"
          >
            Add
          </button>
        </div>

        {/* File upload */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFilesSelected}
        />

        {/* Preview */}
        {(files.length > 0 || imageUrls.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            {files.map((file, i) => (
              <div key={`f-${i}`} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white px-1 rounded text-xs"
                >
                  X
                </button>
              </div>
            ))}

            {imageUrls.map((url, i) => (
              <div key={`u-${i}`} className="relative">
                <img src={url} className="w-full h-24 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white px-1 rounded text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
