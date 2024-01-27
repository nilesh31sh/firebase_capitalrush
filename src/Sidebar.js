// Sidebar.js

import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Ensure you have a corresponding CSS file for styling

const Sidebar = ({ isOpen, toggle }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="toggle-button" onClick={toggle}>
        {isOpen ? '←' : '→'} {/* Arrow icons could be replaced with icons from a library like FontAwesome */}
      </button>
      <ul className="sidebar-menu">
        {/* <li>
          <Link to="/contests" onClick={toggle}>Home</Link>
        </li> */}
        <li>
          <Link to="/contests" onClick={toggle}>Contests</Link> {/* This is the new link for contests */}
        </li>
        <li>
          <Link to="/users" onClick={toggle}>Users</Link>
        </li>
        <li>
          <Link to="/create-contest" onClick={toggle}>Create Contest</Link>
        </li>
        <li>
          <Link to="/reports" onClick={toggle}>Reports Display</Link>
        </li>
        {/* Add more sidebar menu items as needed */}
      </ul>
    </div>
  );
};

export default Sidebar;
