// components/WeatherWidget.jsx
import { useState } from 'react';
import { Cloud, MapPin, ThermometerSun } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function WeatherWidget({ location = 'Troy,NY' }) {
  const [city, setCity] = useState(location);

  // Free Weather API 
  const { data, error, isLoading } = useSWR(
    city ? `https://wttr.in/${city}?format=j1` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const weather = data?.current_condition?.[0];
  const tempF = weather?.temp_F;
  const tempC = weather?.temp_C;
  const description = weather?.weatherDesc?.[0]?.value;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="text-blue-500" size={20} />
        <h3 className="font-semibold text-gray-900">Weather for Meetup</h3>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-gray-400" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none px-1 py-1"
        />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">Unable to load weather</p>
      )}

      {weather && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ThermometerSun className="text-orange-500" size={32} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{tempF}°F</p>
              <p className="text-sm text-gray-500">({tempC}°C)</p>
            </div>
          </div>
          <p className="text-sm text-gray-700">{description}</p>
          <p className="text-xs text-gray-500 mt-2">
            💡 Check weather before meeting to trade!
          </p>
        </div>
      )}
    </div>
  );
}