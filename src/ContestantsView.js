import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

import './ContestantsView.css';

const ContestantsView = () => {
  const [contestants, setContestants] = useState([]);
  const { contestId } = useParams(); // Getting contestId from URL parameters

  useEffect(() => {
    const contestRef = ref(database, `CONTESTS/${contestId}/Contestants`);
    const unsubscribe = onValue(contestRef, (snapshot) => {
      const contestantsData = snapshot.val();
      if (contestantsData) {
        const contestantsArray = Object.values(contestantsData);
        setContestants(contestantsArray);
      }
    });

    return () => unsubscribe();
  }, [contestId]);

  // Aggregate headers by iterating through the first contestant's properties
  const tableHeaders = contestants.length > 0 ? Object.keys(contestants[0]) : [];

  return (
    <div>
      <h2>Contestants for Contest {contestId}</h2>
      <Link to="/contests" className="btn-back">
        Back to Contest Details
      </Link>
      <table className="contestants-table">
        <thead>
          <tr>
            {tableHeaders.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contestants.map((contestant, index) => (
            <tr key={index}>
              {tableHeaders.map((header) => (
                <td key={`${index}-${header}`}>{contestant[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContestantsView;
