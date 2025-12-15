
// Navbar.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package, User, LogOut, Plus, Home, Menu, X, Trash2,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // NEW: profile dropdown
  const [showDelete, setShowDelete] = useState(false); // NEW: delete modal

  const location = useLocation();
  const navigate = useNavigate();

  const drawerRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const menuBtnRef = useRef(null);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setMenuOpen(false);
        setShowDelete(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Simple focus management for mobile drawer
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      toggleBtnRef.current?.focus();
    }
  }, [mobileOpen]);

  // Close profile menu if clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (!menuOpen) return;
      const btn = menuBtnRef.current;
      const menu = document.getElementById('profile-menu');
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const Brand = (
    <div className="flex items-center">
      <Package className="text-blue-600 mr-2" size={20} />
      <Link to="/" className="font-semibold text-gray-900">
        The Exchanger
      </Link>
    </div>
  );

  const DesktopLinks = (
    <div className="hidden md:flex items-center gap-4">
      {user ? (
        <>
          <Link to="/" className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
            <Home size={16} /> Home
          </Link>
          <Link to="/browse" className="text-gray-700 hover:text-blue-600">
            Browse
          </Link>
          <Link to="/create" className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
            <Plus size={16} /> Create Listing
          </Link>
          <Link to="/my-listings" className="text-gray-700 hover:text-blue-600">
            My Items
          </Link>

          {/* Profile menu trigger */}
          <button
            ref={menuBtnRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="ml-2 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-800 flex items-center gap-2"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <User size={16} />
            <span>Hi, {user.name}!</span>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              id="profile-menu"
              role="menu"
              className="absolute right-4 top-14 z-50 w-56 rounded-md border bg-white shadow-lg"
            >
              <div className="p-2">
                <Link
                  to="/account"
                  className="block px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-800"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Account settings
                </Link>

                <button
                  className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-sm text-red-700 flex items-center gap-2"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowDelete(true);
                  }}
                >
                  <Trash2 size={16} />
                  Delete account…
                </button>

                <button
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-800 flex items-center gap-2"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Link to="/browse" className="text-gray-700 hover:text-blue-600">
            Browse Items
          </Link>
          <Link to="/login" className="text-gray-700 hover:text-blue-600">
            Login
          </Link>
          <Link
            to="/register"
            className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Sign Up
          </Link>
        </>
      )}
    </div>
  );

  const MobileToggle = (
    <button
      ref={toggleBtnRef}
      onClick={toggleMobile}
      className="md:hidden p-2 rounded-lg hover:bg-gray-100"
      aria-label="Toggle menu"
    >
      {mobileOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );

  const MobileDrawer = (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/20 transition-opacity ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl border-l transition-transform ${mobileOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
        aria-label="Menu"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Menu size={18} />
            <span className="font-semibold">Menu</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-2">
          {user ? (
            <>
              <Link to="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Home
              </Link>
              <Link to="/browse" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Browse
              </Link>
              <Link to="/create" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Create Listing
              </Link>
              <Link to="/my-listings" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                My Items
              </Link>

              <div className="px-3 py-2 text-xs text-gray-500">Signed in as {user.name}</div>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  setShowDelete(true);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-red-50 text-red-700 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete account…
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/browse" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Browse Items
              </Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded hover:bg-gray-100">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </aside>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Brand */}
        {Brand}
        {/* Right: Desktop links */}
        {DesktopLinks}
        {/* Right: Mobile toggle */}
        {MobileToggle}
      </div>

      {/* Mobile drawer */}
      {MobileDrawer}

      {/* Delete account modal */}
      {showDelete && (
        <DeleteAccountModal
          onClose={() => setShowDelete(false)}
          onDeleted={() => {
            // Clear auth + redirect to login/home
            logout();
            localStorage.removeItem('token');
            setShowDelete(false);
            navigate('/login');
            window.location.reload();
          }}
        />
      )}
    </header>
  );
}

/** -------- DeleteAccountModal (inline component for simplicity) -------- */
function DeleteAccountModal({ onClose, onDeleted }) {
  const [ack, setAck] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const canDelete = ack && confirmText === 'DELETE' && !loading;

 async function handleDelete() {
  setErrMsg('');
  setLoading(true);

  try {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:5000/api';

    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 204) {
      onDeleted?.();
      return;
    }

    // Handle error responses
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete account.');

  } catch (err) {
    setErrMsg(err.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-md p-4">
        <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
          <Trash2 size={18} /> Delete account
        </h2>

        <p className="text-sm text-gray-700 mt-2">
          This will permanently delete your account and all associated listings and trade offers.
          This action cannot be undone.
        </p>

        <label className="flex items-center gap-2 mt-3">
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

        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full text-sm border-b border-gray-300 focus:border-red-600 outline-none px-1 py-1"
            placeholder="DELETE"
          />
        </div>

        {errMsg && <p className="text-sm text-red-600 mt-3">{errMsg}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className={`px-3 py-2 rounded text-white ${
              canDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
           </div>
    </div>
  );
}