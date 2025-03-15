import React, { useState, useEffect } from 'react';
import axios from 'axios';
import M from 'materialize-css'; // Import Materialize for JavaScript components

const Register = ({ setRegistered }) => {
  const [userId, setUserId] = useState('');
  const [completeName, setCompleteName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [promotion, setPromotion] = useState('default'); // Default value
  const [group, setGroup] = useState('default'); // Default value
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Initialize select elements
    M.AutoInit();
  }, []);

  useEffect(() => {
    if (promotion) {
      axios.get(`http://localhost:3000/students?promotion=${promotion}`)
        .then(response => {
          setStudents(response.data);
        })
        .catch(error => {
          console.error("Error fetching students:", error);
        });
    }
  }, [promotion]);

  const handleRegister = async (e) => {
    e.preventDefault();
    // Check if promotion or group is empty
    if (promotion === "default" || group === "default") {
      alert("Please select both promotion and group.");
      return; // Prevent form submission
    }

    try {
      await axios.post('http://localhost:3000/register', { firstName, lastName, email, promotion, group, userId });
      alert('Registration successful. Check your email for the password.');
      localStorage.setItem('email', email);
      setRegistered(true);
    } catch (error) {
      alert('Error registering user');
    }
  };

  const reinitialize = (e) => {
    setUserId('');
    setCompleteName('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPromotion('default'); // Default value
    setGroup('default'); // Default value
    setStudents([]);
  }

  const handleCompleteNameChange = (e) => {
    setCompleteName(e.target.value);
    if(lastName !== '') {
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

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <div className="input-field">
          <select id="promotion" value={promotion} onChange={(e) => setPromotion(e.target.value)} required>
            <option value="default" disabled>Choisir une promotion</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
            <option value="D1">D1</option>
            <option value="D2">D2</option>
            <option value="Année complémentaire">Année complémentaire</option>
          </select>
          <label htmlFor="promotion">Promotion</label>
        </div>
        <div className="input-field">
          <select id="group" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="default" disabled>Choisir un groupe</option>
            <option value="Gr1">Gr1</option>
            <option value="Gr2">Gr2</option>
            <option value="Gr3">Gr3</option>
            <option value="Gr4">Gr4</option>
          </select>
          <label htmlFor="group">Groupe</label>
        </div>

        <div className="input-field">
          <input type="text" id="completename" value={completeName} onChange={handleCompleteNameChange} required />
          <label htmlFor="completename">Nom</label>
          {lastName === '' &&
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
        </div>

        <div className="input-field">
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="email">Email</label>
        </div>

        <button type="submit" className="btn waves-effect waves-light">Enregistrer</button>
        <button type="cancel" className="btn waves-effect waves-light right" onClick={reinitialize}>Annuler</button>
      </form>
    </div>
  );
};

export default Register;
