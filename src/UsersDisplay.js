import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination } from 'react-table';
import { Link } from 'react-router-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import './UserDisplay.css';

const UserDisplay = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userRef = ref(database, 'USERS');
    const unsubscribe = onValue(userRef, (snapshot) => {
      const snapshotData = snapshot.val() || {};
      const formattedData = Object.entries(snapshotData)
        .map(([id, entry]) => ({
          id,
          ...entry
        }))
        .sort((a, b) => (b.IsRequestingWithdrawal === true) ? 1 : -1); // Sorting logic

      setData(formattedData);
      setLoading(false);
    }, (error) => {
      setError('Failed to load data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);




  const columns = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    // Manually defined columns
    const manualColumns = [
      {
        Header: 'User ID',
        accessor: 'id',
      },
      {
        Header: 'myContestsJoined',
        accessor: 'myContestsJoined',
        Cell: ({ row }) => <Link to={`/users/${row.original.id}/myContestsJoined`}>View Contests</Link>,
      },
      {
        Header: 'myContestsCompleted',
        accessor: 'myContestsCompleted',
        Cell: ({ row }) => <Link to={`/users/${row.original.id}/myContestsCompleted`}>View Contests</Link>,
      },
      {
        Header: 'Is Requesting Withdrawal',
        accessor: 'IsRequestingWithdrawal',
        // its a boolean
        Cell: ({ value }) => value ? 'True' : 'False'
      },
      {
        Header: 'Withdrawal Amount',
        accessor: 'WithdrawalAmount',
      },
      {
        Header: 'Winning Amount',
        accessor: 'WinningAmount',
      }
    ];
    




    // Extract keys from data for additional columns
    const additionalColumns = data.length > 0
      ? Object.keys(data[0]).reduce((acc, key) => {
        if (!manualColumns.find(col => col.accessor === key)) {
          acc.push({
            Header: key.charAt(0).toUpperCase() + key.slice(1),
            accessor: key,
            Cell: ({ value }) => {
              if (value && typeof value === 'object' && !(value instanceof Date)) {
                const stringValue = JSON.stringify(value, null);
                //return span with class name cell-truncate
                if (stringValue.length > 30) {
                  return <span className="cell-truncate" title={stringValue}>{stringValue.substring(0, 30) + "..."}</span>;
                }
                return <span className="cell-truncate" title={stringValue}>{stringValue}</span>;

              }
              //if boolean value then return true or false
              if (typeof value === 'boolean') {
                return value ? 'True' : 'False';
              }

              return value;
            }
          });
        }
        return acc;
      }, [])
      : [];


    // Combine manually defined columns and additional columns
    return [...manualColumns, ...additionalColumns];
  }, [data]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0 } },
    usePagination
  );

  // Destructure the required properties and methods from the table instance
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = tableInstance;

  if (loading) return <p>Loading user data...</p>;
  if (error) return <p>{error}</p>;
  if (data.length === 0) return <p>No user data available</p>;

  return (
    <div className='container-everything'>
      <h2>User Details</h2>
      <div className='table-container'>
      <table {...getTableProps()} className="user-table">
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
          {page.map(row => {
            prepareRow(row);
            const IsRequestingWithdrawal = row.original.IsRequestingWithdrawal; // Get the value
            return (
              <tr {...row.getRowProps()} className={IsRequestingWithdrawal ? 'user-request-withdrawal' : ''}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>

      </table>
      <div className="pagination">
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>
        </span>
      </div>
      </div>
    </div>
  );
};

export default UserDisplay;
