import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import './ContestDisplay.css';

const ContestDisplay = () => {
  const [contestData, setContestData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10); // Number of entries per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch contest data from Firebase
  useEffect(() => {
    const contestRef = ref(database, 'CONTESTS');
    const unsubscribe = onValue(contestRef, (snapshot) => {
      setContestData(snapshot.val() || {});
      setLoading(false);
    }, (error) => {
      setError('Failed to load data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Display loading or error message
  if (loading) {
    return <p>Loading contest data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!contestData || Object.keys(contestData).length === 0) {
    return <p>No contest data available</p>;
  }

  // Generate table headers
  const tableHeaders = ['Contestants', ...new Set(Object.keys(contestData).flatMap(key => Object.keys(contestData[key]).filter(header => header !== 'Contestants')))];
  
  // Pagination logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = Object.entries(contestData).slice(indexOfFirstEntry, indexOfLastEntry);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div>
      <h2>Contest Details</h2>
      <div>
        <table className="contest-table">
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
                    {header === 'Contestants' ? <Link to={`/contests/${id}`}>View Contestants</Link> : entry[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          {Array.from({ length: Math.ceil(Object.keys(contestData).length / entriesPerPage) }, (_, index) => (
            <button key={index} onClick={() => handlePageChange(index + 1)} className={currentPage === index + 1 ? 'active' : ''}>{index + 1}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContestDisplay;
