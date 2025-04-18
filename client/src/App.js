import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import './App.css';

// Fix marker icon issue for Leaflet + Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [weather, setWeather] = useState(null);
  const [stages, setStages] = useState([]);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = '17ced4ffb7c054e71e04110fd7051752'; // OpenWeatherMap API key
      const lat = -1.286389;
      const lon = 36.817223;

      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        setWeather(response.data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeather();
  }, []);

  // Fetch stages from backend
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/stages');
        setStages(response.data);
      } catch (error) {
        console.error('Error fetching stages:', error);
      }
    };

    fetchStages();
  }, []);

  return (
    <div className="app">
      <h1>Nairobi CBD Map & Weather</h1>

      {weather ? (
        <div className="weather">
          <h3>Weather Forecast</h3>
          <p>🌡️ Temp: {weather.main.temp}°C</p>
          <p>🌥️ Condition: {weather.weather[0].description}</p>
          <p>💨 Wind: {weather.wind.speed} m/s</p>
        </div>
      ) : (
        <p>Loading weather data...</p>
      )}

      <MapContainer
        center={[-1.286389, 36.817223]}
        zoom={14.5}
        scrollWheelZoom={false}
        style={{ height: '500px', width: '100%', marginTop: '1rem', borderRadius: '10px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Render each stage as a Marker */}
        {stages.map((stage) => (
          <Marker
            key={stage.stage_id}
            position={[stage.latitude, stage.longitude]}
          >
            <Popup>
              {stage.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
