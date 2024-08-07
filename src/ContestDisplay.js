import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination, useFilters, useSortBy } from 'react-table';
import { Link } from 'react-router-dom';
import { db } from './firebase'; // Ensure this imports your Firestore instance
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './ContestDisplay.css';

const ContestDisplay = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterInputMatchType, setFilterInputMatchType] = useState('');
  const [filterInputDuration, setFilterInputDuration] = useState('');

  useEffect(() => {
    const fetchContestData = async () => {
      try {
        const contestsCollection = collection(db, 'CONTESTS');
        const querySnapshot = await getDocs(contestsCollection);
        const formattedData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(contest => contest.ContestID !== undefined); // Filter out contests without ContestID

        setData(formattedData);
        setLoading(false);
      } catch (error) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchContestData();
  }, []);

  const filterTypes = useMemo(() => ({
    fuzzyText: (rows, id, filterValue) => {
      return rows.filter(row => {
        const rowValue = row.values[id];
        return rowValue !== undefined
          ? String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
          : true;
      });
    },
    startsWith: (rows, id, filterValue) => {
      return rows.filter(row => {
        const rowValue = row.values[id];
        return rowValue !== undefined
          ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
          : true;
      });
    },
  }), []);

  const defaultColumn = useMemo(() => ({
    Filter: ({ column: { filterValue, setFilter, preFilteredRows, id } }) => {
      return (
        <input
          value={filterValue || ''}
          onChange={e => {
            setFilter(e.target.value || undefined);
          }}
          placeholder={`Search ${id}`}
        />
      );
    }
  }), []);

  const handleDelete = async (contestId) => {
    try {
      const contestDocRef = doc(db, 'CONTESTS', contestId);
      await deleteDoc(contestDocRef);
      setData(prevData => prevData.filter(contest => contest.id !== contestId));
      console.log(`Contest ${contestId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting contest ${contestId}:`, error);
    }
  };

  const columns = useMemo(() => {
    const manualColumns = [
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <button onClick={() => handleDelete(row.original.id)}>
            Delete
          </button>
        )
      },
      {
        Header: 'ContestID',
        accessor: 'ContestID'
      },
      {
        Header: 'Contest Name',
        accessor: 'ContestName'
      },
      {
        Header: 'StartTime',
        accessor: 'StartTime'
      },
      {
        Header: 'EndTime',
        accessor: 'EndTime'
      },
      {
        Header: 'Duration',
        accessor: 'Duration'
      },
      {
        Header: 'Ended',
        accessor: 'ended',
        Cell: ({ value }) => typeof value === 'boolean' ? (value ? 'True' : 'False') : value
      },
      {
        Header: 'Contestants',
        accessor: 'Contestants',
        Cell: ({ row }) => <Link to={`/contests/${row.original.ContestID}`}>View Contestants</Link>
      },
      {
        Header: 'Contest Type',
        accessor: 'MatchType'
      },
      {
        Header: 'FirstPrize',
        accessor: 'FirstPrize'
      },
      {
        Header: 'SecondPrize',
        accessor: 'SecondPrize'
      },
      {
        Header: 'ThirdPrize',
        accessor: 'ThirdPrize'
      },
      {
        Header: 'FourthPrize',
        accessor: 'FourthPrize'
      },
      {
        Header: 'FifthPrize',
        accessor: 'FifthPrize'
      },
      {
        Header: 'PrizePoolSuggested',
        accessor: 'PrizePoolSuggested'
      },
      {
        Header: 'PrizePoolPlatformFees',
        accessor: 'PrizePoolPlatformFees'
      },
      {
        Header: 'PrizePoolToShow',
        accessor: 'PrizePoolToShow'
      },
    ];

    const additionalColumns = data.length > 0 
      ? Object.keys(data[0]).reduce((acc, key) => {
          if (!manualColumns.find(col => col.accessor === key)) {
            acc.push({
              Header: key.charAt(0).toUpperCase() + key.slice(1),
              accessor: key,
              Cell: ({ value }) => {
                if (value && typeof value === 'object' && !(value instanceof Date)) {
                  const stringValue = JSON.stringify(value, null);
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

    return [...manualColumns, ...additionalColumns];
  }, [data]);

  const initialState = { pageIndex: 0, sortBy: [{ id: 'StartTime', desc: false }] };

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
    setAllFilters,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      initialState,
      defaultColumn,
      filterTypes,
    },
    useFilters,
    useSortBy,
    usePagination,
  );

  const handleFilterChangeMatchType = e => {
    const value = e.target.value || undefined;
    setAllFilters(filters => [
      ...filters.filter(filter => filter.id !== 'MatchType'),
      { id: 'MatchType', value: value }
    ]);
    setFilterInputMatchType(value);
  };

  const handleFilterChangeDuration = e => {
    const value = e.target.value || undefined;
    setAllFilters(filters => [
      ...filters.filter(filter => filter.id !== 'Duration'),
      { id: 'Duration', value: value }
    ]);
    setFilterInputDuration(value);
  };

  if (loading) {
    return <p>Loading contest data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (data.length === 0) {
    return <p>No contest data available</p>;
  }

  return (
    <div className='container-everything'>
      <h2>Contest Details</h2>
        
      <div className="filter-container"> 
        <label className="filter-label">
          Match Type: 
          <input
            className="filter-input"
            value={filterInputMatchType}
            onChange={handleFilterChangeMatchType}
            placeholder="Filter by Match Type"
          />
        </label>
        
        <label className="filter-label">
          Duration:  
          <input
            className="filter-input"
            value={filterInputDuration}
            onChange={handleFilterChangeDuration}
            placeholder="Filter by Duration"
          />
        </label>
      </div>
        
      <div className="table-container">
        <table {...getTableProps()} className="contest-table">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? (column.isSortedDesc ? ' 🔽' : ' 🔼')
                        : ' ↕️'}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
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
        <div className="pagination">
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {'<'}
          </button>{' '}
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {'>'}
          </button>
          <span>
            Page{' '}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{' '}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContestDisplay;
