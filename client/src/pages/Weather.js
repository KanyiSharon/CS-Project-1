// src/pages/Weather.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Weather.css';

function Weather() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Nairobi CBD coordinates
  const lat = -1.286389;
  const lon = 36.817223;
  const apiKey = '17ced4ffb7c054e71e04110fd7051752';

  // Fetch current weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const [currentResponse, forecastResponse] = await Promise.all([
          axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
          axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        ]);
        
        setWeather(currentResponse.data);
        setForecast(forecastResponse.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Failed to fetch weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherEmoji = (weatherCode) => {
    const code = weatherCode?.toString();
    if (code?.startsWith('2')) return '⛈️'; // Thunderstorm
    if (code?.startsWith('3') || code?.startsWith('5')) return '🌧️'; // Rain
    if (code?.startsWith('6')) return '❄️'; // Snow
    if (code?.startsWith('7')) return '🌫️'; // Atmosphere
    if (code === '800') return '☀️'; // Clear sky
    if (code?.startsWith('8')) return '☁️'; // Clouds
    return '🌤️'; // Default
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="weather-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-container">
        <div className="error-message">
          <h2>Weather Service Unavailable</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-container">
      <h1>Nairobi CBD Weather</h1>
      
      {/* Current Weather */}
      {weather && (
        <div className="current-weather">
          <div className="weather-header">
            <div className="weather-icon">
              {getWeatherEmoji(weather.weather[0]?.id)}
            </div>
            <div className="weather-info">
              <h2>{Math.round(weather.main.temp)}°C</h2>
              <p className="weather-description">
                {weather.weather[0]?.description}
              </p>
              <p className="location">{weather.name}</p>
            </div>
          </div>
          
          <div className="weather-details">
            <div className="detail-item">
              <span className="label">Feels like</span>
              <span className="value">{Math.round(weather.main.feels_like)}°C</span>
            </div>
            <div className="detail-item">
              <span className="label">Humidity</span>
              <span className="value">{weather.main.humidity}%</span>
            </div>
            <div className="detail-item">
              <span className="label">Wind</span>
              <span className="value">{Math.round(weather.wind?.speed * 3.6)} km/h</span>
            </div>
            <div className="detail-item">
              <span className="label">Pressure</span>
              <span className="value">{weather.main.pressure} hPa</span>
            </div>
            <div className="detail-item">
              <span className="label">Visibility</span>
              <span className="value">{(weather.visibility / 1000).toFixed(1)} km</span>
            </div>
            <div className="detail-item">
              <span className="label">UV Index</span>
              <span className="value">{weather.uvi || 'N/A'}</span>
            </div>
          </div>

          <div className="sun-times">
            <div className="sun-time">
              <span className="sun-icon">🌅</span>
              <div>
                <p className="sun-label">Sunrise</p>
                <p className="sun-value">{formatTime(weather.sys.sunrise)}</p>
              </div>
            </div>
            <div className="sun-time">
              <span className="sun-icon">🌇</span>
              <div>
                <p className="sun-label">Sunset</p>
                <p className="sun-value">{formatTime(weather.sys.sunset)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecast && (
        <div className="forecast-section">
          <h3>5-Day Forecast</h3>
          <div className="forecast-grid">
            {forecast.list
              .filter((item, index) => index % 8 === 0) // Get one forecast per day (every 8th item = 24 hours)
              .slice(0, 5)
              .map((item, index) => (
                <div key={index} className="forecast-item">
                  <p className="forecast-date">
                    {index === 0 ? 'Today' : formatDate(item.dt)}
                  </p>
                  <div className="forecast-icon">
                    {getWeatherEmoji(item.weather[0]?.id)}
                  </div>
                  <div className="forecast-temps">
                    <span className="high-temp">{Math.round(item.main.temp_max)}°</span>
                    <span className="low-temp">{Math.round(item.main.temp_min)}°</span>
                  </div>
                  <p className="forecast-description">
                    {item.weather[0]?.main}
                  </p>
                  <div className="forecast-details">
                    <small>💧 {item.main.humidity}%</small>
                    <small>💨 {Math.round(item.wind?.speed * 3.6)} km/h</small>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      {forecast && (
        <div className="hourly-section">
          <h3>24-Hour Forecast</h3>
          <div className="hourly-scroll">
            {forecast.list.slice(0, 8).map((item, index) => (
              <div key={index} className="hourly-item">
                <p className="hourly-time">
                  {index === 0 ? 'Now' : formatTime(item.dt)}
                </p>
                <div className="hourly-icon">
                  {getWeatherEmoji(item.weather[0]?.id)}
                </div>
                <p className="hourly-temp">{Math.round(item.main.temp)}°</p>
                <div className="hourly-details">
                  <small>💧 {item.pop ? Math.round(item.pop * 100) : 0}%</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="last-updated">
        <p>Last updated: {new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
    </div>
  );
}

export default Weather;