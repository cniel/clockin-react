import React, { useEffect, useState } from 'react';
import axios from 'axios';
import M from 'materialize-css'; // Import Materialize for JavaScript components
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';

const EventList = ({ events, email }) => {

  const [clockedInEvents, setClockedInEvents] = useState([]);

  useEffect(() => {
    const fetchClockedInEvents = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/clockedInEvents?email=${email}`);
        setClockedInEvents(response.data); // Assuming response.data is an array of event IDs
      } catch (error) {
        M.toast({ html: 'Erreur lors de la récupération des événements.', classes: 'orange' });
      }
    };

    fetchClockedInEvents();
  }, [email]);

  const handleClockIn = async (event) => {
    try {
      await axios.post('http://localhost:3000/clockin', {
        email: email,
        eventId: event.id, // Send the event ID to identify the event
        eventSummary: event.summary, // Optionally send more details if needed
      });
      M.toast({ html: 'Enregistré !', classes: 'green' });
      setClockedInEvents((prev) => [...prev, event.id]);
    } catch (error) {
      M.toast({ html: 'Erreur...', classes: 'orange' });
    }
  };

  return (
    <div className="card">
      <div className="card-content">
        <span className="card-title">Cours :</span>
        {events.length > 0 ? (
          <ul className="collection">
            {events.map((event) => {
              const isClockedIn = clockedInEvents.includes(event.id);
              return (
                <li key={event.id} className={`collection-item ${isClockedIn ? 'grey lighten-4' : ''}`}>
                  <h5>{event.summary}</h5>
                  {event.description && <p><strong>Description:</strong> {event.description}</p>}
                  {event.location && <p><strong>Location:</strong> {event.location}</p>}
                  <p><strong>Start:</strong> {new Date(event.start.dateTime || event.start.date).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(event.end.dateTime || event.end.date).toLocaleString()}</p>

                  <div className="col s12 center-align" style={{ display: "flex", justifyContent: "center" }} >
                    <button
                      className={`waves-effect waves-light btn`}
                      onClick={() => handleClockIn(event)}
                      disabled={isClockedIn} // Disable button if already clocked in
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: ".656rem" }} // Flexbox styles
                    >Choisir
                    </button>
                    {isClockedIn &&
                      <img
                        src='/check-mark-in-a-circle.svg'
                        alt="ok"
                        style={{ width: '30px', position: 'relative', transform: 'translate(40px, 2px)' }}
                      />}
                  </div>

                </li>
              );
            })}
          </ul>
        ) : (
          <p>...</p>
        )}
      </div>
    </div>
  );
};

export default EventList;
