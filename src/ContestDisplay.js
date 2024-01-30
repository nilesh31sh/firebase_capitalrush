import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination, useFilters, useSortBy } from 'react-table';
import { Link } from 'react-router-dom';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import './ContestDisplay.css';

const ContestDisplay = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterInputMatchType, setFilterInputMatchType] = useState('');
  const [filterInputDuration, setFilterInputDuration] = useState('');

  useEffect(() => {
    const contestRef = ref(database, 'CONTESTS');
    const unsubscribe = onValue(contestRef, (snapshot) => {
      const snapshotData = snapshot.val() || {};
      const formattedData = Object.entries(snapshotData).map(([id, entry]) => ({
        id,
        ...entry
      }));
      setData(formattedData);
      setLoading(false);
    }, (error) => {
      setError('Failed to load data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filterTypes = useMemo(() => ({
    // Add a new fuzzyText filter type.
    fuzzyText: (rows, id, filterValue) => {
      return rows.filter(row => {
        const rowValue = row.values[id];
        return rowValue !== undefined
          ? String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
          : true;
      });
    },
    // Add a new startsWith filter type.
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
    // Let's set up our default Filter UI
    Filter: ({ column: { filterValue, setFilter, preFilteredRows, id } }) => {
      return (
        <input
          value={filterValue || ''}
          onChange={e => {
            setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
          }}
          placeholder={`Search ${id}`}
        />
      );
    }
  }), []);

  const columns = useMemo(() => {
    const manualColumns = [
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
        Header: '   EndTime   ',
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

      // ... other manually defined columns ...
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
                  //return span with class name cell-truncate
                  if (stringValue.length > 30){
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

  // This is where you combine manualColumns and additionalColumns
  return [...manualColumns, ...additionalColumns];
}, [data]); // Dependency array for useMemo


const initialState = { pageIndex: 0, sortBy: [{ id: 'StartTime', desc: false }] }; // Assuming 'StartTime' is the correct accessor


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
    initialState, // Use the initialState
    defaultColumn, // Be sure to pass the defaultColumn option
    filterTypes,
  },
  useFilters,
  useSortBy ,
  usePagination,
  // Add useSortBy hook here
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
        
        <div class="filter-container"> 
          <label class="filter-label">
            Match Type : 
            <input
              class="filter-input"
              value={filterInputMatchType}
              onChange={handleFilterChangeMatchType}
              placeholder="Filter by Match Type"
            />
          </label>
        
          <label class="filter-label">
            Duration :  
            <input
              class="filter-input"
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
                  : ' ↕️'} {/* Default indicator for unsorted columns */}
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
