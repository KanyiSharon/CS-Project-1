// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Map from './pages/Map';
import Weather from './pages/Weather';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/map" element={<Map />} />
      <Route path="/weather" element={<Weather />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;