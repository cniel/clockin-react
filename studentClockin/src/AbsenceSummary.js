import React, { useEffect, useState } from 'react';
import axios from 'axios';
import M from 'materialize-css';

const AbsenceSummary = () => {
  const [promotion, setPromotion] = useState('');
  const [absenceSummary, setAbsenceSummary] = useState([]);
  const [absenceDetails, setAbsenceDetails] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Materialize select
    const elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);

    if (promotion && isAuthenticated) {
      const fetchAbsenceSummary = async () => {
        try {
          const response = await axios.get('http://localhost:3000/absence-count-by-promotion', {
            params: { promotion },
            headers: { 'x-access-code': accessCode }
          });
          setAbsenceSummary(response.data);
        } catch (error) {
          console.error('Error fetching absence summary:', error);
        }
      };

      fetchAbsenceSummary();
    }
  }, [promotion, isAuthenticated]);

  const handleStudentClick = async (studentId) => {
    try {
      const response = await axios.get('http://localhost:3000/absence-details-by-student', {
        params: { etudiantid: studentId },
        headers: { 'x-access-code': accessCode }
      });
      setAbsenceDetails(response.data);
      setSelectedStudent(studentId);
    } catch (error) {
      console.error('Error fetching absence details:', error);
    }
  };

  const handleBackClick = () => {
    setSelectedStudent(null);
    setAbsenceDetails([]);
  };

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    // Here you can add additional validation if needed
    setIsAuthenticated(true);
  };

  const handleMarkAsPresent = async (eventId, eventTitle) => {
    try {
      await axios.post('http://localhost:3000/mark-as-present', {
        etudiantid: selectedStudent,
        eventId,
        eventTitle,
        promotion
      }, {
        headers: { 'x-access-code': accessCode }
      });
      alert('Student marked as present');
      // Refresh absence details
      handleStudentClick(selectedStudent);
    } catch (error) {
      console.error('Error marking student as present:', error);
      alert('Error marking student as present');
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
      <h2>Absence Summary</h2>
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

      {selectedStudent && (
        <div>
          <h3>Absence Details for Student {selectedStudent}</h3>
          <button className="btn waves-effect waves-light" onClick={handleBackClick}>
            Back to Summary
          </button>
          <table className="highlight">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Start</th>
                <th>End</th>
                <th>Was Present</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absenceDetails.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.eventTitle}</td>
                  <td>{detail.start}</td>
                  <td>{detail.end}</td>
                  <td>{detail.was_present ? 'Yes' : 'No'}</td>
                  <td>
                    {!detail.was_present && (
                      <button
                        className="btn waves-effect waves-light"
                        onClick={() => handleMarkAsPresent(detail.eventId, detail.eventTitle)}
                      >
                        Mark as Present
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {promotion && !selectedStudent && (
        <>
          <table className="highlight">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Nombre d'absences</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {absenceSummary.map(student => (
                <tr key={student.studentId}>
                  <td>{student.studentId}</td>
                  <td>{student.name}</td>
                  <td>{student.firstname}</td>
                  <td>{student.absenceCount}</td>
                  <td>
                    <button className="btn waves-effect waves-light" onClick={() => handleStudentClick(student.studentId)}>
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AbsenceSummary;