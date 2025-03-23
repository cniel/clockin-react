import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import M from 'materialize-css'; // Import Materialize for JavaScript components

const Admin = () => {
  const [activeTab, setActiveTab] = useState('byPromotion');
  const [promotion, setPromotion] = useState('P1');
  const [completeName, setCompleteName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [userId, setUserId] = useState('');
  const [qrCodes, setQRCodes] = useState({});

  useEffect(() => {
    // Initialize select elements
    M.AutoInit();
    axios.get(`http://192.168.1.38:3000/students`)
      .then(response => {
        setStudents(response.data);
      })
      .catch(error => {
        console.error("Error fetching students:", error);
      });
  }, []);

  useEffect(() => {
    setResults([]);
    // Initialize Materialize select elements
    const elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);
  }, [activeTab]);

  const fetchQRCodes = useCallback(async () => {
    try {
      const response = await axios.get('http://192.168.1.38:3000/admin/qrcodes', { params: { promotion } });
      setQRCodes(response.data);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    }
  }, [promotion]);

  useEffect(() => {
    if (activeTab === 'qrcodes') {
      fetchQRCodes();
    }
  }, [activeTab, fetchQRCodes]);

  const handleSearch = async () => {
    let endpoint = '';
    const params = {};

    switch (activeTab) {
      case 'byPromotion':
        endpoint = '/clockins-by-promotion';
        params.promotion = promotion;
        break;
      case 'byUser':
        endpoint = '/clockins-by-user';
        params.etudiantid = userId;
        break;
      case 'byYear':
        endpoint = '/clockins-by-year';
        params.year = year;
        break;
      case 'byMonth':
        endpoint = '/clockins-by-month';
        params.month = month;
        break;
      default:
        break;
    }

    try {
      const response = await axios.get("http://192.168.1.38:3000" + endpoint, { params });
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching clock-ins:', error);
    }
  };

  const handleCompleteNameChange = (e) => {
    setCompleteName(e.target.value);
    if (lastName !== '') {
      setLastName('');
      setFirstName('');
      setUserId('');
    }
  }

  // Function to filter students based on input
  const filterStudents = (input) => {
    if (input === '')
      return [];

    return students.filter(student =>
      student.prenom.toLowerCase().includes(input.toLowerCase()) ||
      student.nom.toLowerCase().includes(input.toLowerCase())
    );
  };

  const printAllQRCodes = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print QR Codes</title><style>');
    printWindow.document.write(`
      @media print {
        .page-break { page-break-after: always; }
        .qrcode-item { text-align: center; margin: 20px; }
        .qrcode-item img { width: 40%; } /* Set the QR code image to 40% of the page width */
      }
      body { margin: 0; padding: 0; }
      .qrcode-item { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; }
    </style></head><body>`);
    
    Object.entries(qrCodes).forEach(([location, qrCodeDataURL]) => {
      printWindow.document.write(`
        <div class="qrcode-item">
          <h4>${location}</h4>
          <img src="${qrCodeDataURL}" alt="QR Code for ${location}" />
        </div>
        <div class="page-break"></div>
      `);
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <div className="row">
        <div className="col s12">
          <ul className="tabs">
            <li className="tab col s2">
              <a className={activeTab === 'byPromotion' ? 'active' : ''} onClick={() => setActiveTab('byPromotion')}>By Promotion</a>
            </li>
            <li className="tab col s2">
              <a className={activeTab === 'byUser' ? 'active' : ''} onClick={() => setActiveTab('byUser')}>By User</a>
            </li>
            <li className="tab col s2">
              <a className={activeTab === 'byYear' ? 'active' : ''} onClick={() => setActiveTab('byYear')}>By Year</a>
            </li>
            <li className="tab col s2">
              <a className={activeTab === 'byMonth' ? 'active' : ''} onClick={() => setActiveTab('byMonth')}>By Month</a>
            </li>
            <li className="tab col s2">
              <a className={activeTab === 'qrcodes' ? 'active' : ''} onClick={() => setActiveTab('qrcodes')}>QR Codes</a>
            </li>
          </ul>
        </div>
      </div>

      {activeTab === 'byPromotion' && (
        <div className="input-field">
          <select id="promotion" value={promotion} onChange={(e) => setPromotion(e.target.value)}>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="D1">D1</option>
            <option value="D2">D2</option>
            <option value="Année complémentaire">Année complémentaire</option>
          </select>
          <label htmlFor="promotion">Promotion</label>
          <button className="btn waves-effect waves-light" onClick={handleSearch}>Search</button>
        </div>
      )}

      {activeTab === 'byUser' && (
        <div className="input-field">
          <input type="text" id="completename" value={completeName} onChange={handleCompleteNameChange} required />
          <label htmlFor="completename">Nom</label>
          {userId === '' &&
            <ul>
              {filterStudents(completeName).map((student, index) => (
                <li key={index} onClick={() => {
                  setUserId(student.etudiantid);
                  setFirstName(student.prenom);
                  setLastName(student.nom);
                  setCompleteName(student.nom + " " + student.prenom);
                }
                }>{student.nom} {student.prenom}</li>
              ))}
            </ul>
          }
          <button className="btn waves-effect waves-light" onClick={handleSearch}>Search</button>
        </div>
      )}

      {activeTab === 'byYear' && (
        <div className="input-field">
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <label htmlFor="year">Year</label>
          <button className="btn waves-effect waves-light" onClick={handleSearch}>Search</button>
        </div>
      )}

      {activeTab === 'byMonth' && (
        <div className="input-field">
          <input
            type="number"
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <label htmlFor="month">Month (1-12)</label>
          <button className="btn waves-effect waves-light" onClick={handleSearch}>Search</button>
        </div>
      )}

      {activeTab === 'qrcodes' && (
        <div>
          <h3>QR Codes for Locations</h3>
          <button className="btn waves-effect waves-light" onClick={printAllQRCodes}>Print All QR Codes</button>
          <div className="qrcode-container">
            {Object.entries(qrCodes).map(([location, qrCodeDataURL], index) => (
              <div key={index} className="qrcode-item">
                <h4>{location}</h4>
                <img src={qrCodeDataURL} alt={`QR Code for ${location}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3>Results:</h3>
        <ul>
          {results.map((result, index) => (
            <>
              {activeTab === 'byPromotion' && (
                <li key={index} className={result.absence_count > 3 ? 'text-highlight' : ''}>
                  <strong>{result.name}</strong> : {result.absence_count} absence(s)
                </li>
              )}
              {activeTab === 'byUser' && (
                <li key={index} className={result.was_present === false ? 'text-highlight' : ''}>
                  <strong>{result.start}&#8594;{result.end}</strong> - {result.eventTitle} : {result.was_present ? (<span>Présent</span>) : (<span>Absent</span>)}
                </li>
              )}
              {(activeTab !== 'byPromotion' && activeTab !== 'byUser') && (
                <li key={index}>{JSON.stringify(result)}</li>
              )}
            </>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Admin;
