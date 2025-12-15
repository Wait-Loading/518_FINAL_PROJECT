
// components/DeleteAccountCard.jsx
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteAccountCard({ endpoint = '/api/auth/me', onDeleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const canDelete = confirmText === 'DELETE' && ack && !loading;

  async function handleDelete() {
    setErrMsg('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.status === 204) {
        localStorage.removeItem('token');
        onDeleted?.(); // e.g., navigate('/login') or router.push('/login')
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete account.');
      }
    } catch (err) {
      setErrMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 border border-red-300 bg-red-50">
      <div className="flex items-center gap-2 mb-3">
        <Trash2 className="text-red-600" size={20} />
        <h3 className="font-semibold text-red-800">Delete Account</h3>
      </div>

      <p className="text-sm text-red-700 mb-2">
        This will permanently delete your account and all associated listings and trade offers.
        This action cannot be undone.
      </p>

      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          className="rounded"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        <span className="text-sm text-gray-800">
          I understand this action is permanent.
        </span>
      </label>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="text-sm border-b border-gray-300 focus:border-red-600 outline-none px-1 py-1 w-48"
          placeholder="DELETE"
        />
      </div>

      {errMsg && <p className="text-sm text-red-600 mb-3">{errMsg}</p>}

      <button
        onClick={handleDelete}
        disabled={!canDelete}
        className={`px-3 py-2 rounded text-white ${
          canDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
        }`}
      >
        {loading ? 'Deleting…' : 'Delete my account'}
      </button>
    </div>
  );
}
