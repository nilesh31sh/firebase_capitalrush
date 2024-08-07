import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import './ContestantsView.css';

const ContestantsView = () => {
  const [contestants, setContestants] = useState([]);
  const { contestId } = useParams(); // Getting contestId from URL parameters

  useEffect(() => {
    const fetchContestants = async () => {
      try {
        // Reference to the Contestants collection within the specific contest
        const contestantsCollection = collection(db, 'CONTESTS', contestId, 'Contestants');
        const querySnapshot = await getDocs(contestantsCollection);
        const contestantsArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setContestants(contestantsArray);
      } catch (error) {
        console.error("Error fetching contestants: ", error);
      }
    };

    fetchContestants();
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
