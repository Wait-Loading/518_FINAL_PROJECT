
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  User,
  LogOut,
  Plus,
  Home,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);
  const toggleBtnRef = useRef(null);

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
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Simple focus management: focus the first interactive element when opening
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstFocusable =
        drawerRef.current.querySelector(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
      firstFocusable?.focus();
    } else {
      // return focus to the toggle button
      toggleBtnRef.current?.focus();
    }
  }, [mobileOpen]);

  const Brand = (
    <Link
      to="/"
      className="flex items-center gap-2 text-2xl font-bold hover:scale-105 transition-transform"
      aria-label="Go to home"
    >
      <div className="bg-white text-blue-600 p-2 rounded-lg">🔄</div>
      <span className="sr-only">The Exchanger</span>
      <span aria-hidden>The Exchanger</span>
    </Link>
  );

  const DesktopLinks = (
    <div className="hidden md:flex gap-6 items-center">
      {user ? (
        <>
          <Link
            to="/"
            className="flex items-center gap-2 hover:bg-blue-500 px-3 py-2 rounded-lg transition"
          >
            <Home size={18} />
            Home
          </Link>

          <Link
            to="/browse"
            className="flex items-center gap-2 hover:bg-blue-500 px-3 py-2 rounded-lg transition"
          >
            <Package size={18} />
            Browse
          </Link>

          <Link
            to="/create"
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            <Plus size={18} />
            Create Listing
          </Link>

          <Link
            to="/my-listings"
            className="flex items-center gap-2 hover:bg-blue-500 px-3 py-2 rounded-lg transition"
          >
            <User size={18} />
            My Items
          </Link>

          <div className="border-l border-blue-400 pl-6 flex items-center gap-4">
            <span className="text-sm">
              Hi, <strong>{user.name}</strong>!
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <Link
            to="/browse"
            className="hover:bg-blue-500 px-3 py-2 rounded-lg transition"
          >
            Browse Items
          </Link>
          <Link
            to="/login"
            className="hover:bg-blue-500 px-3 py-2 rounded-lg transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
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
      type="button"
      onClick={toggleMobile}
      className="md:hidden inline-flex items-center justify-center p-2 rounded-lg bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
      aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={mobileOpen}
      aria-controls="mobile-nav"
    >
      {mobileOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  );

  const MobileDrawer = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        id="mobile-nav"
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white text-gray-800 shadow-xl transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="px-4 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-blue-700">
            <Package size={20} />
            Menu
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 py-3 space-y-1">
          {user ? (
            <>
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Home size={18} />
                Home
              </Link>

              <Link
                to="/browse"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Package size={18} />
                Browse
              </Link>

              <Link
                to="/create"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Listing
              </Link>

              <Link
                to="/my-listings"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <User size={18} />
                My Items
              </Link>

              <div className="mt-3 border-t pt-3 flex items-center justify-between">
                <span className="text-sm">
                  Signed in as <strong>{user.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/browse"
                className="block px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                Browse Items
              </Link>
              <Link
                to="/login"
                className="block px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Left: Brand */}
          {Brand}

          {/* Right: Desktop links */}
          {DesktopLinks}

          {/* Right: Mobile toggle */}
          {MobileToggle}
               </div>
      </div>

      {/* Mobile drawer */}
      {MobileDrawer}
    </nav>
  );
}