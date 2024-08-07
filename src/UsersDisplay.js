import React, { useMemo, useState, useEffect } from 'react';
import { useTable } from 'react-table';
import { Link } from 'react-router-dom';
import { db } from './firebase'; // Ensure db is correctly exported from your firebase configuration
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import './UserDisplay.css';

const UserDisplay = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usersCollection = collection(db, 'USERS');
        const querySnapshot = await getDocs(usersCollection);
        const formattedData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => (b.IsRequestingWithdrawal === true) ? 1 : -1);

        setData(formattedData);
        setLoading(false);
      } catch (error) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Function to handle the withdrawal status change
  const handleWithdrawalStatusChange = async (userId) => {
    try {
      const userDocRef = doc(db, `USERS/${userId}`);
      await updateDoc(userDocRef, {
        IsRequestingWithdrawal: false,
        WithdrawalAmount: 0
      });
      console.log('Withdrawal status updated for user:', userId);
      // Optionally, refresh the data in your component here
      setData(prevData => prevData.map(user =>
        user.id === userId ? { ...user, IsRequestingWithdrawal: false, WithdrawalAmount: 0 } : user
      ));
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
    }
  };

  const columns = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

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

    const additionalColumns = data.length > 0
      ? Object.keys(data[0]).reduce((acc, key) => {
        if (!manualColumns.find(col => col.accessor === key)) {
          acc.push({
            Header: key.charAt(0).toUpperCase() + key.slice(1),
            accessor: key,
            Cell: ({ value }) => {
              if (value && typeof value === 'object' && !(value instanceof Date)) {
                const stringValue = JSON.stringify(value, null, 2);
                if (stringValue.length > 30) {
                  return <span className="cell-truncate" title={stringValue}>{stringValue.substring(0, 30) + "..."}</span>;
                }
                return <span className="cell-truncate" title={stringValue}>{stringValue}</span>;
              }
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

    const actionColumn = {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => (
        <button
          onClick={() => handleWithdrawalStatusChange(row.original.id)}
          disabled={!row.original.IsRequestingWithdrawal}
          style={{ opacity: row.original.IsRequestingWithdrawal ? 1 : 0.5 }}
        >
          Withdrawal Done
        </button>
      ),
    };

    return [actionColumn, ...manualColumns, ...additionalColumns];
  }, [data]);

  const tableInstance = useTable({ columns, data });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows
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
            {rows.map(row => {
              prepareRow(row);
              const IsRequestingWithdrawal = row.original.IsRequestingWithdrawal;
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
      </div>
    </div>
  );
};

export default UserDisplay;
