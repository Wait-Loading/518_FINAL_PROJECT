
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';

// Public pages
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import Login from './components/Login';
import Register from './components/Register';
import ListingDetailsPage from './pages/ListingDetailsPage';
import EditListingPage from './pages/EditListingPage';

// Protected pages
import CreateListingPage from './pages/CreateListingPage';
import MyListingsPage from './pages/myListing';
import RequireAuth from './components/RequireAuth';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Listing details (view single listing + trade offers) */}
            <Route path="/listings/:id" element={<ListingDetailsPage />} />

            {/* ✅ Edit listing (owner-only, protected) */}
            <Route
              path="/listings/:id/edit"
              element={
                <RequireAuth>
                  <EditListingPage />
                </RequireAuth>
              }
            />

            {/* Protected routes */}
            <Route
              path="/create"
              element={
                <RequireAuth>
                  <CreateListingPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-listings"
              element={
                <RequireAuth>
                  <MyListingsPage />
                </RequireAuth>
              }
            />

            {/* 404 fallback */}
            <Route
              path="*"
              element={<div className="p-8 text-center text-xl">Page Not Found</div>}
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}