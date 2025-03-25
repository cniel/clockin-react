import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'materialize-css/dist/css/materialize.min.css';
import 'materialize-css/dist/js/materialize.min.js';

const AdminTabs = () => {
  const location = useLocation();

  return (
    <div className="container">
      <ul className="tabs">
        <li className="tab col s3">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Absence Summary</Link>
        </li>
        <li className="tab col s3">
          <Link to="/add-clockin" className={location.pathname === '/add-clockin' ? 'active' : ''}>Add Clockin</Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminTabs;