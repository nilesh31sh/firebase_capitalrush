import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import './UserDisplay.css';

const UserDisplay = () => {
  const [userData, setUserData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userRef = ref(database, 'USERS');
    const unsubscribe = onValue(userRef, (snapshot) => {
      setUserData(snapshot.val() || {});
      setLoading(false);
    }, (error) => {
      setError('Failed to load data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading user data...</p>;
  if (error) return <p>{error}</p>;
  if (!userData || Object.keys(userData).length === 0) return <p>No user data available</p>;

  const handleNestedData = (data) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2); // Converts object to a formatted string
    }
    return data;
  };

  // Update here to include myContestsJoined
  const tableHeaders = Object.keys(userData).reduce((acc, key) => {
    const userKeys = Object.keys(userData[key]);
    userKeys.forEach(k => {
      if (!acc.includes(k)) acc.push(k);
    });
    return acc;
  }, []);

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = Object.entries(userData).slice(indexOfFirstEntry, indexOfLastEntry);

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  return (
    <div>
      <h2>User Details</h2>
      <table className="user-table">
        <thead>
          <tr>
            {tableHeaders.map(header => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {currentEntries.map(([id, entry]) => (
            <tr key={id}>
              {tableHeaders.map(header => (
                <td key={`${id}-${header}`}>
                  {header === 'myContestsCompleted' || header === 'myContestsJoined' ? (
                    <Link to={`/users/${id}/${header}`}>{`View ${header}`}</Link>
                  ) : (
                    handleNestedData(entry[header])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        {Array.from({ length: Math.ceil(Object.keys(userData).length / entriesPerPage) }, (_, index) => (
          <button key={index} onClick={() => handlePageChange(index + 1)} className={currentPage === index + 1 ? 'active' : ''}>
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserDisplay;
