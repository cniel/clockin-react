import React, { useEffect, useState } from 'react';
import axios from 'axios';
import M from 'materialize-css';
import * as XLSX from 'xlsx';

const AbsenceSummary = () => {
  const [promotion, setPromotion] = useState('');
  const [absenceSummary, setAbsenceSummary] = useState([]);
  const [absenceDetails, setAbsenceDetails] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [showOnlyAbsences, setShowOnlyAbsences] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize Materialize select
    const elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);

    if (promotion && isAuthenticated) {
      const fetchAbsenceSummary = async () => {
        try {
          const response = await axios.get('http://192.168.1.38:3000/absence-count-by-promotion', {
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

  const handleStudentClick = async (studentId, studentName) => {
    try {
      const response = await axios.get('http://192.168.1.38:3000/absence-details-by-student', {
        params: { etudiantid: studentId },
        headers: { 'x-access-code': accessCode }
      });
      setAbsenceDetails(response.data);
      setSelectedStudentId(studentId);
      setSelectedStudentName(studentName);
    } catch (error) {
      console.error('Error fetching absence details:', error);
    }
  };

  const handleBackClick = () => {
    setSelectedStudentId(null);
    setAbsenceDetails([]);
  };

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    // Here you can add additional validation if needed
    setIsAuthenticated(true);
  };

  const handleMarkAsPresent = async (eventId, eventTitle) => {
    try {
      await axios.post('http://192.168.1.38:3000/mark-as-present', {
        etudiantid: selectedStudentId,
        eventId,
        eventTitle,
        promotion
      }, {
        headers: { 'x-access-code': accessCode }
      });

      M.toast({ html: 'Étudiant marqué comme présent', classes: 'orange' });
      // Refresh absence details
      handleStudentClick(selectedStudentId, selectedStudentName);
    } catch (error) {
      M.toast({ html: 'Erreur lors de la mise à jour de la présence de l\'étudiant', classes: 'red' });
    }
  };

  const handleDeleteClockin = async (eventId) => {
    try {
      await axios.post('http://192.168.1.38:3000/delete-clockin', {
        etudiantid: selectedStudentId,
        eventId
      }, {
        headers: { 'x-access-code': accessCode }
      });
      // Refresh absence details
      handleStudentClick(selectedStudentId, selectedStudentName);
      M.toast({ html: 'Pointage supprimé', classes: 'orange' });
    } catch (error) {
      M.toast({ html: 'Erreur lors de la suppression du pointage.', classes: 'red' });
    }
  };

  const exportToExcel = (data, isPromo) => {

    // Define column headers
    const headers = {
      studentId: 'ID Étudiant',
      name: 'Nom',
      firstname: 'Prénom',
      absenceCount: 'Nombre d\'absences',
      eventTitle: 'UF',
      start: 'Début',
      end: 'Fin',
      was_present: 'Présent'
    };

    // Map data to new headers
    const mappedData = data.map(item => {
      const mappedItem = {};
      for (const key in item) {
        if (key === 'eventId') {
          continue; // Skip eventId if isPromo is true
        }
        if (headers[key]) {
          mappedItem[headers[key]] = item[key];
        } else {
          mappedItem[key] = item[key];
        }
      }
      return mappedItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    
    const sheet_title = "Absences";
    let wrkbk_title;
    if(isPromo){
      wrkbk_title = "AbsenceSummary_" + promotion + ".xlsx";
    } else {
      wrkbk_title = "AbsenceSummary_" + 
        selectedStudentName + "_" +
        promotion + ".xlsx";
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet_title);
    XLSX.writeFile(workbook, wrkbk_title);
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <h2>Portail Administrateur</h2>
        <form onSubmit={handleAccessCodeSubmit}>
          <div className="input-field">
            <input
              type="password"
              id="accessCode"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
            <label htmlFor="accessCode">Mot de passe</label>
          </div>
          <button className="btn waves-effect waves-light" type="submit">
            Choisir
          </button>
        </form>
      </div>
    );
  }

  const filteredAbsenceDetails = showOnlyAbsences
  ? absenceDetails.filter(detail => !detail.was_present)
  : absenceDetails;

  return (
    <div className="container">
      <h2>Rapport de présence</h2>
      <div className="input-field col s12">
        <select
          id="promotion"
          value={promotion}
          onChange={(e) => setPromotion(e.target.value)}
        >
          <option value="" disabled>Sélectionner une promotion</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="D1">D1</option>
          <option value="D2">D2</option>
          <option value="AC">AC</option>
        </select>
        <label htmlFor="promotion">Sélectionner une promotion</label>
      </div>

      {!selectedStudentId && (
        <button className="btn waves-effect waves-light right" onClick={() => exportToExcel(absenceSummary, true)}>
          Excel {promotion}
        </button>
      )}

      {selectedStudentId && (
        <div>
          <h3>{selectedStudentName.replace("_", " ")}</h3>
          <button className="btn waves-effect waves-light" onClick={handleBackClick}>
            Retour à la promotion
          </button>

          <button
            className="btn waves-effect waves-light"
            style={{ marginLeft: '10px' }}
            onClick={() => setShowOnlyAbsences(!showOnlyAbsences)}
          >
            {showOnlyAbsences ? 'Afficher toutes les présences' : 'Afficher uniquement les absences'}
          </button>

          <button className="btn waves-effect waves-light right" style={{ marginRight: '5px' }} onClick={() => exportToExcel(absenceDetails, false)}>
            Excel {selectedStudentName.replace("_", " ")}
          </button>

          <table className="highlight">
            <thead>
              <tr>
                <th>Cours</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Présent.e</th>
                <th>Action</th>
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
                        Noter comme présent.e
                      </button>
                    )}
                    {detail.was_present && (
                      <button
                        className="btn red waves-effect waves-light"
                        onClick={() => handleDeleteClockin(detail.eventId)}
                      >
                        Noter comme absent.e
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {promotion && !selectedStudentId && (
        <>
          <table className="highlight">
            <thead>
              <tr>
                {/* <th>ID</th> */}
                <th>Nom</th>
                <th>Prénom</th>
                <th>Nombre d'absences</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {absenceSummary.map(student => (
                <tr key={student.studentId}>
                  {/* <td>{student.studentId}</td> */}
                  <td>{student.name}</td>
                  <td>{student.firstname}</td>
                  <td>{student.absenceCount}</td>
                  <td>
                    <button className="btn waves-effect waves-light" onClick={() => handleStudentClick(student.studentId, student.name + "_" + student.firstname)}>
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