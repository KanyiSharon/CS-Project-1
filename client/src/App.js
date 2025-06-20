// src/App.js
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './pages/Navbar';
import Home from './pages/Home';
// import Search from './pages/Search';
// import Map from './pages/Map';
// import Weather from './pages/Weather';
import NotFound from './pages/NotFound';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import './App.css';
import LostAndFound from './pages/lostandfound.js'; 
import DriverAlertsForm from './pages/DriverAlertsForm.js';
import RatingsDisplay from './pages/RatingsDisplay.js';
import RatingForm from './pages/RatingForm.js';
import DriverAlertsDisplay from './pages/DriverAlertsDisplay.js';



function App() {
  const location = useLocation();
  
  // Hide navbar on login and signup pages
  const hideNavbar = ['/login', '/signup'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/lostandfound" element={<LostAndFound />} />
        <Route path="/driveralertsform" element={<DriverAlertsForm />} />
        <Route path="/ratingsdisplay" element={<RatingsDisplay />} />
        <Route path="/ratingform" element={<RatingForm />} />
        <Route path="/driveralertsdisplay" element={<DriverAlertsDisplay />} />

        {/* <Route path="/search" element={<Search />} /> */}
        {/* <Route path="/map" element={<Map />} /> */}
        {/* <Route path="/weather" element={<Weather />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;