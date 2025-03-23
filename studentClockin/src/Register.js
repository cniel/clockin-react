import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import M from 'materialize-css'; // Import Materialize for JavaScript components
import Select from 'react-select';

const Register = ({ setRegistered }) => {
  const [userId, setUserId] = useState('');
  const [completeName, setCompleteName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [promotion, setPromotion] = useState('default'); // Default value
  const [group, setGroup] = useState('default'); // Default value
  const [students, setStudents] = useState([]);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Initialize Materialize select and autocomplete
    M.AutoInit();
    if (autocompleteRef.current) {
      M.Autocomplete.init(autocompleteRef.current, {
        data: students.reduce((acc, student) => {
          acc[`${student.nom} ${student.prenom}`] = null; // Autocomplete data format
          return acc;
        }, {}),
      });
    }
  }, [students]);

  useEffect(() => {
    if (promotion) {
      axios
        .get(`http://192.168.1.38:3000/students?promotion=${promotion}`)
        .then((response) => {
          setStudents(response.data);
        })
        .catch((error) => {
          M.toast({ html: 'Erreur lors de la récupération des étudiants.', classes: 'red' });
        });
    }
  }, [promotion]);

  const handleRegister = async (e) => {
    e.preventDefault();
    // Check if promotion or group is empty
    console.log("userId : ", userId);
    if (promotion === 'default' || group === 'default' || !userId) {
      M.toast({ html: 'Veuillez selectionner une promotion, un groupe et un étudiant parmi la liste proposée.', classes: 'red' });
      return; // Prevent form submission
    }

    try {
      await axios.post('http://192.168.1.38:3000/register', {
        firstName,
        lastName,
        email,
        promotion,
        group,
        userId,
      });
      M.toast({ html: 'Inscription réussie. Un mot de passe a été envoyé sur votre boîte mail.', classes: 'green' });
      localStorage.setItem('email', email);
      setRegistered(true);
    } catch (error) {
      M.toast({ html: 'Erreur lors de l\'inscription.', classes: 'red' });
    }
  };

  const reinitialize = () => {
    setUserId('');
    setCompleteName('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPromotion('default'); // Default value
    setGroup('default'); // Default value
    setStudents([]);
  };

  const handleSelectName = (selected) => {
      console.log("selected: ", selected);
      const selectedStudent = students.find(
        (student) => student.etudiantid === selected.value
      );

      if (selectedStudent) {
        setUserId(selectedStudent.etudiantid);
        setFirstName(selectedStudent.prenom);
        setLastName(selectedStudent.nom);
        setCompleteName(`${selectedStudent.nom} ${selectedStudent.prenom}`);
        setEmail(selectedStudent.email || '');
      }
    
  }

  return (
    <div className="container">
      <h2>Enregistrement</h2>
      <form onSubmit={handleRegister}>
        <div className="input-field">
          <select
            id="promotion"
            value={promotion}
            onChange={(e) => setPromotion(e.target.value)}
            required
          >
            <option value="default" disabled>
              Choisir une promotion
            </option>
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
          <select
            id="group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="default" disabled>
              Choisir un groupe
            </option>
            <option value="Gr1">Gr1</option>
            <option value="Gr2">Gr2</option>
            <option value="Gr3">Gr3</option>
            <option value="Gr4">Gr4</option>
          </select>
          <label htmlFor="group">Groupe</label>
        </div>

        <div className="input-field">
          <Select
            options={students.map((student) => ({
              value: student.etudiantid,
              label: `${student.nom} ${student.prenom}`,
              firstName: student.prenom,
              lastName: student.nom,
            }))}
            onChange={handleSelectName}
            placeholder="Rechercher un étudiant"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Ensure the dropdown is above other elements
            }}
          />
        </div>

        <div className="input-field">
          <input
            type="email"
            id="email"
            value={email || ''}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="email">Email</label>
        </div>

        <button type="submit" className="btn waves-effect waves-light">
          Enregistrer
        </button>
        <button
          type="button"
          className="btn waves-effect waves-light right"
          onClick={reinitialize}
        >
          Annuler
        </button>
      </form>
    </div>
  );
};

export default Register;