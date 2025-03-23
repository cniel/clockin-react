import React, { useState } from 'react';
import axios from 'axios';
import M from 'materialize-css';


const Login = ({ setLoggedIn, setEmail, setEvents }) => {
  const [email, setEmailInput] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://192.168.1.38:3000/login', { email, password });
      const { token, events } = response.data;
      setEmail(email);
      localStorage.setItem('email', email);
      localStorage.setItem('token', token);
      setEvents(events); // Set the events received from the server
      setLoggedIn(true);
    } catch (error) {
      M.toast({ html: 'Email ou mot de passe incorrect.', classes: 'red' });
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form>
        <div className="input-field">
          <input type="email" id="email" value={email} onChange={(e) => setEmailInput(e.target.value)} required />
          <label htmlFor="email">Email</label>
        </div>
        <div className="input-field">
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label htmlFor="password">Password</label>
        </div>
        <button type="submit" className="btn waves-effect waves-light blue" onClick={handleLogin}>Login</button>
      </form>
    </div>
  );
};

export default Login;
