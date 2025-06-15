// src/pages/Home.js
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import '../styles/Home.css';

// Fix marker icon issue for Leaflet + Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create a green marker icon
const createGreenGlowingIcon = () => {
  const greenMarkerHtml = `
    <div class="green-marker-container">
      <div class="green-marker"></div>
    </div>
  `;

  return L.divIcon({
    html: greenMarkerHtml,
    className: 'green-glow-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });
};

// Default icon
const defaultIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map view changes
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function Home() {
  const [weather, setWeather] = useState(null);
  const [stages, setStages] = useState([]);
  const [operations, setOperations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOperations, setFilteredOperations] = useState([]);
  const [mapCenter, setMapCenter] = useState([-1.286389, 36.817223]);
  const [mapZoom, setMapZoom] = useState(14.5);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState(null);
  const markersRef = useRef({});

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      const apiKey = '17ced4ffb7c054e71e04110fd7051752';
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

  // Fetch operations (SACCO details with routes and stages)
  useEffect(() => {
    const fetchOperations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/operations');
        setOperations(response.data);
      } catch (error) {
        console.error('Error fetching operations:', error);
      }
    };
    fetchOperations();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOperations([]);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = operations.filter(operation => 
      operation.sacco_name?.toLowerCase().includes(searchTermLower) ||
      operation.route_name?.toLowerCase().includes(searchTermLower) ||
      operation.from_stage?.toLowerCase().includes(searchTermLower)
    );

    setFilteredOperations(filtered);

    // If we have search results, center the map on the first result
    if (filtered.length > 0 && filtered[0].stage_latitude && filtered[0].stage_longitude) {
      setMapCenter([filtered[0].stage_latitude, filtered[0].stage_longitude]);
      setMapZoom(16);
    }
  }, [searchTerm, operations]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const highlightMarker = (operation) => {
    setMapCenter([operation.stage_latitude, operation.stage_longitude]);
    setMapZoom(17);
    
    // Set the highlighted marker ID
    setHighlightedMarkerId(`op-${operation.sacco_id}`);
    
    // Remove highlight after 9 seconds
    setTimeout(() => {
      setHighlightedMarkerId(null);
    }, 9000);
  };

  return (
    <div className="home-container">
      <h1>Nairobi CBD Weather & Map</h1>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Matatu sacco name, stage or route..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {/* Weather Section */}
      {weather ? (
        <div className="weather">
          <h3>Today's Weather</h3>
          <p>🌡️ Temperature: {weather.main.temp}°C</p>
          <p>🌥️ Conditions: {weather.weather[0].description}</p>
          <p>💨 Wind Speed: {weather.wind.speed} m/s</p>
        </div>
      ) : (
        <p>Loading weather data...</p>
      )}

      {/* SACCO Search Results - Only show when searching */}
      {searchTerm.trim() !== '' && (
        <div className="search-results">
          <h3>Transit Options</h3>
          {filteredOperations.length > 0 ? (
            <div className="sacco-list">
              {filteredOperations.map(operation => (
                <div key={operation.sacco_id} className="sacco-card">
                  <h4>{operation.sacco_name}</h4>
                  <p><strong>Base Fare:</strong> {operation.base_fare_range}</p>
                  <p><strong>Route:</strong> {operation.route_name}</p>
                  <p><strong>Stage:</strong> {operation.from_stage}</p>
                  {operation.stage_latitude && operation.stage_longitude && (
                    <button onClick={() => highlightMarker(operation)}>
                      View on Map
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No transit options found matching your search.</p>
          )}
        </div>
      )}

      {/* Map Section */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%', marginTop: '1rem' }}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Render all stages as Markers */}
        {stages.map((stage) => (
          <Marker
            key={stage.stage_id}
            position={[stage.latitude, stage.longitude]}
          >
            <Popup>
              <strong>{stage.name}</strong>
            </Popup>
          </Marker>
        ))}
        
        {/* Render filtered operations with potential highlighting */}
        {filteredOperations.map((operation) => {
          if (!operation.stage_latitude || !operation.stage_longitude) return null;
          
          const markerId = `op-${operation.sacco_id}`;
          const isHighlighted = markerId === highlightedMarkerId;
          
          return (
            <Marker
              key={markerId}
              position={[operation.stage_latitude, operation.stage_longitude]}
              icon={isHighlighted ? createGreenGlowingIcon() : defaultIcon}
              ref={(ref) => {
                if (ref) {
                  markersRef.current[markerId] = ref;
                }
              }}
            >
              <Popup>
                <div>
                  <h4>{operation.sacco_name}</h4>
                  <p><strong>Base Fare:</strong> {operation.base_fare_range}</p>
                  <p><strong>Route:</strong> {operation.route_name}</p>
                  <p><strong>Stage:</strong> {operation.from_stage}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default Home;