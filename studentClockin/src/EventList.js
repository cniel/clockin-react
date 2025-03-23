import React, { useEffect, useState } from 'react';
import axios from 'axios';
import M from 'materialize-css'; // Import Materialize for JavaScript components
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';

const EventList = ({ events, email }) => {

  const [clockedInEvents, setClockedInEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {

    const fetchPendingEvents = async () => {
      try {
        const response = await axios.get(`http://192.168.1.38:3000/pendingEvents?email=${email}`);
        setPendingEvents(response.data);
      } catch (error) {
        M.toast({ html: 'Erreur lors de la récupération des événements.', classes: 'orange' });
      }
    };

    const fetchClockedInEvents = async () => {
      try {
        const response = await axios.get(`http://192.168.1.38:3000/clockedInEvents?email=${email}`);
        setClockedInEvents(response.data);
        await fetchPendingEvents();
      } catch (error) {
        M.toast({ html: 'Erreur lors de la récupération des événements.', classes: 'orange' });
      }
    };

    

    const fetchNextEvent = async () => {
      try {
        const response = await axios.get(`http://192.168.1.38:3000/nextEvent?email=${email}`);
        setNextEvent(response.data); // Assuming response.data is the next event object
      } catch (error) {
        M.toast({ html: 'Erreur lors de la récupération du prochain événement.', classes: 'orange' });
      }
    };

    fetchClockedInEvents();
    fetchNextEvent();
  }, [email]);

  const handleClockIn = async (event, isCli) => {
    try {
      await axios.post('http://192.168.1.38:3000/clockin', {
        email: email,
        eventId: event.id, // Send the event ID to identify the event
        eventSummary: event.summary, // Optionally send more details if needed
        isCli: isCli
      });
    
      M.toast({ html: 'Enregistré !', classes: 'green' });
      setClockedInEvents((prev) => [...prev, event.id]);

      setPendingEvents((prev) => [...prev, event.id]);

    } catch (error) {
      M.toast({ html: 'Erreur...', classes: 'orange' });
    }
  };

  const handleMarkAsCompleted = async (event) => {
    try {
      await axios.post('http://192.168.1.38:3000/mark-as-completed', {
        email: email,
        eventId: event.id, // Send the event ID to identify the event
        eventSummary: event.summary, // Optionally send more details if needed
      });

      M.toast({ html: 'Fin de clinique enregistrée !', classes: 'green' });
      // Remove the event from the pending events list
      setPendingEvents((prev) => prev.filter((id) => id !== event.id));

    } catch (error) {
      M.toast({ html: 'Erreur...', classes: 'orange' });
    }
  };

  const lessThan10MinutesLeft = (endDateTime) => {
    console.log(endDateTime);
    const now = new Date(2025, 2, 10, 12, 8, 0, 0); // Current date and time
    const end = new Date(endDateTime);
    console.log(now)
    const diff = (end - now) / 1000 / 60; // Difference in minutes
    console.log(diff);
    return diff <= 10;
  };

   // Compute completedEvents dynamically
   const completedEvents = clockedInEvents.filter(
    (eventId) => !pendingEvents.includes(eventId)
  );

  return (
    <div className="card">
      <div className="card-content">
        <span className="card-title">Cours :</span>
        {events.length > 0 ? (
          <ul className="collection">
            {events.map((event) => {
              const isClockedIn = clockedInEvents.includes(event.id);
              const isCli = event.summary.includes("CLI-FC") || event.summary.includes("Form Prat Clin CFC");
              const isCliCompleted = completedEvents.includes(event.id);

              return (
                <li key={event.id} className={`collection-item ${isClockedIn ? 'grey lighten-4' : ''}`}>
                  <h5>{event.summary}</h5>
                  {event.description && <p><strong>Description:</strong> {event.description}</p>}
                  {event.location && <p><strong>Location:</strong> {event.location}</p>}
                  <p><strong>Start:</strong> {new Date(event.start.dateTime || event.start.date).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(event.end.dateTime || event.end.date).toLocaleString()}</p>

                  <div className="col s12 center-align" style={{ display: "flex", justifyContent: "center", alignItems: "center" }} >
                    <button
                      className={`waves-effect waves-light btn`}
                      onClick={() => handleClockIn(event, isCli)}
                      disabled={isClockedIn} // Disable button if already clocked in
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: ".656rem" }} // Flexbox styles
                    >
                      {isClockedIn ? 'Choisi' : 'Choisir'}
                    </button>

                    <img
                      src='/check-mark-in-a-circle.svg'
                      alt="ok"
                      style={{ width: '30px', marginLeft: '10px', opacity: isClockedIn ? 1 : 0 }}
                    />
                  </div>

                  {(event.summary.includes("CLI-FC") || event.summary.includes("Form Prat Clin CFC")) && (
                    <div className="col s12 center-align" style={{ display: "flex", justifyContent: "center", alignItems: "center" }} >
                      <button
                        disabled={isCliCompleted || !lessThan10MinutesLeft(event.end.dateTime)}
                        className="waves-effect waves-light btn"
                        onClick={() => handleMarkAsCompleted(event)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: ".656rem", marginLeft: '10px' }} // Flexbox styles
                      >
                        {isCliCompleted ? 'Terminé' : 'Terminer'}
                      </button>

                      <img
                        src='/check-mark-in-a-circle.svg'
                        alt="ok"
                        style={{ width: '30px', marginLeft: '10px', opacity: isCliCompleted ? 1 : 0 }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          nextEvent ? (
            <div>
              <h5>Aucun cours pour le moment</h5>
              <h6>Prochain cours :</h6>
              <ul className="collection">
                <li className="collection-item">
                  <h5>{nextEvent.summary}</h5>
                  {nextEvent.description && <p><strong>Description:</strong> {nextEvent.description}</p>}
                  {nextEvent.location && <p><strong>Location:</strong> {nextEvent.location}</p>}
                  <p><strong>Start:</strong> {new Date(nextEvent.start.dateTime || nextEvent.start.date).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(nextEvent.end.dateTime || nextEvent.end.date).toLocaleString()}</p>
                </li>
              </ul>
            </div>
          ) : (
            <p>Aucun cours pour le moment.</p>
          )
        )}
      </div>
    </div>
  );
};

export default EventList;
