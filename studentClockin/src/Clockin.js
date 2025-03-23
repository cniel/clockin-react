import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EventList from './EventList'; // Import the EventList component
import M from 'materialize-css';


// events
const Clockin = ({ email }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const handleLoadEvents = async () => {
      try {
        const response = await axios.post('http://192.168.1.38:3000/loadevents', { email });
        setEvents(response.data.events); // Set the events received from the server
      } catch (error) {
        M.toast({ html: 'Erreur lors du chargement des évènements', classes: 'red' });
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

    </div>
  );
};

export default Clockin;
