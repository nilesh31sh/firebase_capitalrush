import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { useTable } from 'react-table';

import './ContestantsView.css';

const UserContestsView = () => {
  const [userContests, setUserContests] = useState([]);
  const { userId, contestType } = useParams(); // Now includes contestType

  useEffect(() => {
    const contestRefPath = `USERS/${userId}/${contestType}`; // Dynamic path based on contestType
    const userContestsRef = ref(database, contestRefPath);
    const unsubscribe = onValue(userContestsRef, (snapshot) => {
      const userContestsData = snapshot.val();
      if (userContestsData) {
        const userContestsArray = Object.entries(userContestsData).map(([id, details]) => ({ id, ...details }));
        setUserContests(userContestsArray);
      }
    });

    return () => unsubscribe();
  }, [userId, contestType]); // Dependency array includes contestType

  // Define columns for react-table
  const columns = React.useMemo(() => {
    return userContests.length > 0
      ? Object.keys(userContests[0]).map(header => {
          return {
            Header: header,
            accessor: header
          };
        })
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
    data: userContests
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
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserContestsView;
