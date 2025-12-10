import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, User, LogOut, Plus, Home } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold hover:scale-105 transition-transform">
            <div className="bg-white text-blue-600 p-2 rounded-lg">
              🔄
            </div>
            The Exchanger
          </Link>

          <div className="flex gap-6 items-center">
            {user ? (
              <>
                <Link to="/" className="flex items-center gap-2 hover:bg-blue-500 px-3 py-2 rounded-lg transition">
                  <Home size={18} />
                  Home
                </Link>
                <Link to="/browse" className="flex items-center gap-2 hover:bg-blue-500 px-3 py-2 rounded-lg transition">
                  <Package size={18} />
                  Browse
                </Link>
                <Link to="/create" className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium">
                  <Plus size={18} />
                  Create Listing
                </Link>
                <Link to="/my-listings" className="flex items-center gap-2 hover:bg-blue-500 px-3 py-2 rounded-lg transition">
                  <User size={18} />
                  My Items
                </Link>
                <div className="border-l border-blue-400 pl-6 flex items-center gap-4">
                  <span className="text-sm">Hi, <strong>{user.name}</strong>!</span>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/browse" className="hover:bg-blue-500 px-3 py-2 rounded-lg transition">
                  Browse Items
                </Link>
                <Link to="/login" className="hover:bg-blue-500 px-3 py-2 rounded-lg transition">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}