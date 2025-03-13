import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EventList from './EventList'; // Import the EventList component


// events
const Clockin = ({ email }) => {
  const [events, setEvents] = useState([]);

  const handleLoadAllEvents = async () => {
    try {
      const response = await axios.post('http://localhost:3000/loadallevents', { email });
      setEvents(response.data.events); // Set the events received from the server
    } catch (error) {
      alert('Error loading events');
    }
  };

  useEffect(() => {
    const handleLoadEvents = async () => {
      try {
        const response = await axios.post('http://localhost:3000/loadevents', { email });
        setEvents(response.data.events); // Set the events received from the server
      } catch (error) {
        alert('Error loading events');
      }
    };

    handleLoadEvents();
  }, [email]);
  

  return (
    <div className="container">
      <h2 className="center-align">Cl
        <img
          src='/time-new.svg'
          alt="Clock In Icon"
          style={{ width: '30px', verticalAlign: 'middle' }}
        />
        ck in
      </h2>

      <EventList events={events} email={email} /> {/* Pass the email to EventList */}

      <div className="row">
        <div className="col s12">
          <button className="btn waves-effect waves-light" onClick={handleLoadAllEvents}>
            Voir tous les cours de la journée
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clockin;
