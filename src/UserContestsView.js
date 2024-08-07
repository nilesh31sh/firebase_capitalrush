import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from './firebase'; // Ensure db is correctly exported from your firebase configuration
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTable } from 'react-table';

import './ContestantsView.css';

const UserContestsView = () => {
  const [userContests, setUserContests] = useState([]);
  const { userId, contestType } = useParams(); // Includes contestType

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const contestsCollection = collection(db, `USERS/${userId}/${contestType}`);
        const contestsQuery = query(contestsCollection);
        const querySnapshot = await getDocs(contestsQuery);

        const contestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUserContests(contestsData);
      } catch (error) {
        console.error('Error fetching contests:', error);
      }
    };

    fetchContests();
  }, [userId, contestType]); // Dependency array includes contestType

  // Define columns for react-table
  const columns = React.useMemo(() => {
    return userContests.length > 0
      ? Object.keys(userContests[0]).map(header => ({
          Header: header,
          accessor: header,
        }))
      : [];
  }, [userContests]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data: userContests,
  });

  return (
    <div>
      <h2>{contestType} by User {userId}</h2>
      <Link to="/users" className="btn-back">
        Back to User Details
      </Link>
      <table {...getTableProps()} className="contestants-table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserContestsView;
