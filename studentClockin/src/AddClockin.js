import React, { useState, useEffect } from 'react';
import axios from 'axios';
import M from 'materialize-css';

const AddClockin = () => {
  const [mode, setMode] = useState('promotion'); // State to manage the mode
  const [promotion, setPromotion] = useState('');
  const [etudiantid, setEtudiantid] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [date, setDate] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Materialize select
    const elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);
  }, []);

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  const handleFetchEvents = async () => {
    try {
      const response = await axios.get('http://192.168.1.38:3000/events', {
        params: { promotion, etudiantid, nom, prenom, date },
        headers: { 'x-access-code': accessCode }
      });
      setEvents(response.data);
    } catch (error) {
      M.toast({ html: 'Erreur lors de la récupération des évènements', classes: 'red' });
    }
  };

  const handleAddClockin = async () => {
    try {
      const response = await axios.post('http://192.168.1.38:3000/add-clockin', {
        promotion,
        etudiantid,
        eventId: selectedEvent.split("@@@")[0],
        eventName: selectedEvent.split("@@@")[1]
      }, {
        headers: { 'x-access-code': accessCode }
      });
      M.toast({ html: 'Saisie de temps ajoutée avec succès', classes: 'green' });
    } catch (error) {
      M.toast({ html: 'Erreur lors de l\'ajout de la saisie de temps', classes: 'red' });

    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h2>Admin Access</h2>
        <form onSubmit={handleAccessCodeSubmit}>
          <div className="input-field">
            <input
              type="password"
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
            <label htmlFor="accessCode">Enter Access Code</label>
          </div>
          <button className="btn waves-effect waves-light" type="submit">
            Submit
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Add Clockin</h2>
      <div className="switch">
        <label>
          Promotion
          <input
            type="checkbox"
            checked={mode === 'student'}
            onChange={() => setMode(mode === 'promotion' ? 'student' : 'promotion')}
          />
          <span className="lever"></span>
          Student
        </label>
      </div>

      <div className="input-field col s12">
        <select
          id="promotion"
          value={promotion}
          onChange={(e) => setPromotion(e.target.value)}
        >
          <option value="" disabled>Select a promotion</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="D1">D1</option>
          <option value="D2">D2</option>
          <option value="AC">AC</option>
        </select>
        <label htmlFor="promotion">Select Promotion</label>
      </div>

      {mode === 'student' && (
        <>
          <div className="input-field">
            <input
              type="text"
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <label htmlFor="nom">Nom</label>
          </div>
          <div className="input-field">
            <input
              type="text"
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <label htmlFor="prenom">Prénom</label>
          </div>
        </>
      )}

      <div className="input-field">
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <label htmlFor="date">Date</label>
      </div>
      <button className="btn waves-effect waves-light" onClick={handleFetchEvents}>
        Fetch Events
      </button>

      {events.length > 0 && (
        <div className="input-field col s12">
          <select
            id="event"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="" disabled>Select an event</option>
            {events.map(event => (
              <option key={event.id} value={event.id + "@@@" + event.title}>
                {event.title} - {event.start}
              </option>
            ))}
          </select>
          <label htmlFor="event">Select Event</label>
        </div>
      )}

      <button className="btn waves-effect waves-light" onClick={handleAddClockin}>
        Add Clockin
      </button>
    </div>
  );
};

export default AddClockin;