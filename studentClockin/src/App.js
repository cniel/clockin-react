import React, { useState, useEffect } from 'react';

import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';

import Register from './Register';
import Login from './Login';
import Clockin from './Clockin'; // Fixed casing issue
import Admin from './Admin';
import AbsenceSummary from './AbsenceSummary';
import AddClockin from './AddClockin';

import EventsForDay from './EventsForDay';
// import ClockQr from './Clockqr';

// import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState('');
  const [events, setEvents] = useState([]); // State to hold events

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    const storedToken = localStorage.getItem('token');
    if (storedEmail && storedToken) {
      setEmail(storedEmail);
      setLoggedIn(true);
    }
  }, []);

  // const handleLogout = async () => {
  //   const token = localStorage.getItem('token');
  //   await axios.post('http://localhost:3000/logout', { token });
  //   localStorage.removeItem('email');
  //   localStorage.removeItem('token');
  //   setLoggedIn(false);
  //   setEvents([]); // Clear events on logout
  // };

  return (
    <Router>
    <div>
      {!loggedIn ? (
        <>
          {!registered ? (
            <Register setRegistered={setRegistered} />
          ) : (
            <Login setLoggedIn={setLoggedIn} setEmail={setEmail} setEvents={setEvents} />
          )}
        </>
      ) : (
        <div>
          <Routes>
            <Route path="/" element={<Clockin email={email} events={events} />}  /> {/*  */}
            <Route path="/admin" element={<AbsenceSummary />} /> {/* Pass events to Clockin */}
            
            {/* <Route path="/events-for-day" element={<EventsForDay />} /> */}
          </Routes>
        </div>
      )}
    </div>
    </Router>
  );
};

export default App;
