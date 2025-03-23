// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import M from 'materialize-css'; // Import Materialize for JavaScript components

// const EventsForDay = () => {
//   const [promotion, setPromotion] = useState('')
//   const [date, setDate] = useState('');
//   const [events, setEvents] = useState([]);

//   useEffect(() => {
//     // Initialize select elements
//     M.AutoInit();
//   }, []);

//   const handleFetchEvents = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('http://192.168.1.38:3000/events-for-day', { date, promotion });
//       setEvents(response.data);
//     } catch (error) {
//       alert('Erreur lors de la récupération des cours: ' + error.message);
//     }
//   };

//   return (
//     <div className="container">
//       <h2>Events for a Given Day</h2>
//       <form onSubmit={handleFetchEvents}>
//         <div className="input-field">
//           <select id="promotion" value={promotion} onChange={(e) => setPromotion(e.target.value)} required>
//             <option value="" disabled>Choisir une promotion</option>
//             <option value="P1">P1</option>
//             <option value="P2">P2</option>
//             <option value="P3">P3</option>
//             <option value="D1">D1</option>
//             <option value="D2">D2</option>
//             <option value="Année complémentaire">Année complémentaire</option>
//           </select>
//           <label htmlFor="promotion">Promotion</label>
//         </div>

//         <div className="input-field">
//           <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
//           <label htmlFor="date">Date</label>
//         </div>

//         <button type="submit" className="btn waves-effect waves-light">Voir</button>
//       </form>

//       {events.length > 0 && (
//         <div className="events-list">
//           {events.map((event) => (
//             <div key={event.id} className="event-card">
//               <h3>{event.summary}</h3>
//               <p><strong>Description:</strong> {event.description}</p>
//               <p><strong>Salle:</strong> {event.location}
//                 &nbsp;/&nbsp;
//                 <strong>Début:</strong> {new Date(event.start.dateTime || event.start.date).toLocaleString()}
//                 &nbsp;/&nbsp;
//                 <strong>Fin:</strong> {new Date(event.end.dateTime || event.end.date).toLocaleString()}</p>
//               <h4>Pointages:</h4>
//               {event.clockIns.length > 0 ? (
//                 <ul>
//                   {event.clockIns.map((clockIn, index) => (
//                     <li key={index}><strong>{clockIn.last_name} {clockIn.first_name}</strong> : {clockIn.email}</li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p>No clock-ins for this event.</p>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default EventsForDay;