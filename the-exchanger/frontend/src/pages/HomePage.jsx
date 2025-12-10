
// src/components/HomePage.jsx
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-6xl font-bold mb-6 animate-slide-up">
            Welcome to The Exchanger
          </h1>
          <p className="text-xl mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Trade anything for anything! The ultimate peer-to-peer exchange platform.
          </p>
          <div className="flex gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {user ? (
              <>
                <Link
                  to="/browse"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition flex items-center gap-2 shadow-lg"
                >
                  Browse Items
                  <ArrowRight />
                </Link>
                <Link
                  to="/create"
                  className="bg-blue-500 px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-400 transition shadow-lg"
                >
                  Create Listing
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition flex items-center gap-2 shadow-lg"
                >
                  Get Started
                  <ArrowRight />
                </Link>
                <Link
                  to="/browse"
                  className="bg-blue-500 px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-400 transition shadow-lg"
                >
                  Browse Items
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose The Exchanger?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card card-hover p-8 text-center">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <Package className="text-blue-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Trade Anything</h3>
            <p className="text-gray-600">
              From electronics to clothes, digital items to services. If you own it, you can trade it!
            </p>
          </div>
          <div className="card card-hover p-8 text-center">
            <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
              <Shield className="text-green-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Safe &amp; Secure</h3>
            <p className="text-gray-600">
              User ratings, reviews, and verification system to ensure safe trading experiences.
            </p>
          </div>
          <div className="card card-hover p-8 text-center">
            <div className="inline-block bg-purple-100 p-4 rounded-full mb-4">
              <Zap className="text-purple-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Fast &amp; Easy</h3>
            <p className="text-gray-600">
              Create listings in seconds, find what you need, and complete trades quickly.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users exchanging items every day!
          </p>
          {user ? (
            <Link to="/create" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              Create a Listing
              <ArrowRight />
            </Link>
          ) : (
            <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              Create Free Account
              <ArrowRight />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
