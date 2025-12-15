
import { useState, useEffect } from 'react'; // ✅ ADD useEffect
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, MapPin, UserPlus } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ new local state for location detection
  const [locStatus, setLocStatus] = useState('idle'); // idle | detecting | gps | geocoding | success | error
  const [locError, setLocError] = useState('');

  const { register, googleLogin } = useAuth(); // ✅ ADD googleLogin
  const navigate = useNavigate();

  // ✅ Google Identity script (unchanged)
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
          document.getElementById('googleSignUpButton'),
          { 
            theme: 'outline', 
            size: 'large',
            width: '100%',
            text: 'signup_with'
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

  // ✅ Auto-detect location via IP on mount (external API inside same file)
  useEffect(() => {
    let cancelled = false;

    const detectByIP = async () => {
      try {
        setLocStatus('detecting');
        setLocError('');
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error(`ipapi.co HTTP ${res.status}`);
        const json = await res.json();
        const city = json.city || '';
        const region = json.region || json.region_code || '';
        const country = json.country_name || json.country || '';
        const locationString = [city, region, country].filter(Boolean).join(', ');
        if (!cancelled) {
          setFormData((s) => ({ ...s, location: locationString }));
          setLocStatus('success');
        }
      } catch (e) {
        if (!cancelled) {
          setLocError(e?.message || 'Unable to detect location from IP');
          setLocStatus('error');
        }
      }
    };

    detectByIP();
    return () => { cancelled = true; };
  }, []);

  // ✅ GPS + reverse geocode fallback (also in same file)
  const handleUseGPS = async () => {
    setLocError('');
    setLocStatus('gps');

    const getCoords = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

    try {
      const { lat, lon } = await getCoords();
      setLocStatus('geocoding');
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`open-meteo geocoding HTTP ${res.status}`);
      const json = await res.json();
      const first = Array.isArray(json.results) ? json.results[0] : null;
      const city = first?.name || '';
      const region = first?.admin1 || '';
      const country = first?.country || '';
      const locationString = [city, region, country].filter(Boolean).join(', ');
      setFormData((s) => ({ ...s, location: locationString }));
      setLocStatus('success');
    } catch (e) {
      setLocError(e?.message || 'Failed to get GPS location');
      setLocStatus('error');
    }
  };

  // ✅ existing Google callback
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await register(formData.name, formData.email, formData.password, formData.location);
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
            <UserPlus className="text-blue-600" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join our trading community today!</p>
        </div>

        <div className="card p-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
          {error && (
            <div className="alert-error animate-fade-in">
              {error}
            </div>
          )}

          {/* ✅ Google button */}
          <div className="mb-6">
            <div id="googleSignUpButton" className="w-full"></div>
          </div>

          {/* ✅ Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* LOCATION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Troy, NY"
                />
              </div>

              {/* helper row: status + actions */}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-600 flex items-center gap-2">
                  {locStatus === 'detecting' && <span>Detecting location via IP…</span>}
                  {locStatus === 'gps' && <span>Getting GPS coordinates…</span>}
                  {locStatus === 'geocoding' && <span>Resolving address…</span>}
                  {locStatus === 'success' && formData.location && (
                    <span>Detected: {formData.location}</span>
                  )}
                  {locStatus === 'error' && (
                    <span className="text-red-600">{locError || 'Location unavailable'}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // retry IP detection
                      setLocStatus('detecting');
                      setLocError('');
                      fetch('https://ipapi.co/json/')
                        .then((r) => {
                          if (!r.ok) throw new Error(`ipapi.co HTTP ${r.status}`);
                          return r.json();
                        })
                        .then((json) => {
                          const city = json.city || '';
                          const region = json.region || json.region_code || '';
                          const country = json.country_name || json.country || '';
                          const locationString = [city, region, country].filter(Boolean).join(', ');
                          setFormData((s) => ({ ...s, location: locationString }));
                          setLocStatus('success');
                        })
                        .catch((e) => {
                          setLocError(e?.message || 'Retry failed');
                          setLocStatus('error');
                        });
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700"
                  >
                    Retry IP
                  </button>

                  <button
                    type="button"
                    onClick={handleUseGPS}
                    className="text-[11px] text-blue-600 hover:text-blue-700"
                  >
                    Use GPS
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Tip: Edit the field if detection is off. We’ll only save what you submit.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

                   <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}