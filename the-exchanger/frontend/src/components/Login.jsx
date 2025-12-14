import { useState, useEffect } from 'react'; // ✅ ADD useEffect
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth(); // ✅ ADD googleLogin
  const navigate = useNavigate();

  // ✅ ADD THIS ENTIRE useEffect
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'outline', 
            size: 'large',
            width: '100%',
            text: 'continue_with'
          }
        );
      }
    };

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // ✅ ADD THIS FUNCTION
  const handleGoogleResponse = async (response) => {
    setError('');
    setLoading(true);
    
    const result = await googleLogin(response.credential);
    setLoading(false);
    
    if (result.success) {
      navigate('/browse');
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/browse');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
            <LogIn className="text-blue-600" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
          <p className="text-gray-600 mt-2">Login to continue trading</p>
        </div>

        <div className="card p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
          {error && (
            <div className="alert-error animate-fade-in">
              {error}
            </div>
          )}

          {/* ✅ ADD THIS GOOGLE BUTTON SECTION */}
          <div className="mb-6">
            <div id="googleSignInButton" className="w-full"></div>
          </div>

          {/* ✅ ADD THIS DIVIDER */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}