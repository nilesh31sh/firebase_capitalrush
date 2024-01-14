import React, { useState, useEffect, useMemo } from 'react';
import { database } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import './ReportDisplay.css';

const ReportDisplay = () => {
  const [reports, setReports] = useState({});
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState(''); // New state for status filter

  useEffect(() => {
    const reportsRef = ref(database, 'HELP_REPORT');
    onValue(reportsRef, (snapshot) => {
      const reportsData = snapshot.val();
      if (reportsData) {
        setReports(reportsData);

        const allKeys = new Set(['status']);
        Object.values(reportsData).forEach(report => {
          Object.keys(report).forEach(key => {
            allKeys.add(key);
          });
        });
        setHeaders([...allKeys]);
      }
      setLoading(false);
    }, (errorObject) => {
      setError(errorObject.message);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = (reportId, newStatus) => {
    update(ref(database, `/HELP_REPORT/${reportId}`), { status: newStatus });
  };

  const filteredReports = useMemo(() => {
    return statusFilter
      ? Object.entries(reports).filter(([id, report]) => report.status === statusFilter)
      : Object.entries(reports);
  }, [reports, statusFilter]);

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = useMemo(() => {
    return filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  }, [filteredReports, indexOfFirstReport, indexOfLastReport]);

  const headersMemo = useMemo(() => {
    return headers.map(header => {
      return { name: header, isBoolean: typeof reports[Object.keys(reports)[0]][header] === 'boolean' };
    });
  }, [headers, reports]);

  const paginate = pageNumber => setCurrentPage(pageNumber);
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredReports.length / reportsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="report-display-container">
      <h2>Help Reports</h2>
      <div className="filter-container">
        <label htmlFor="statusFilter">Filter by Status: </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <option value="">All</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Complete">Complete</option>
        </select>
      </div>
      <table className="report-table">
        <thead>
          <tr>
            {headersMemo.map(({ name }) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentReports.map(([id, report]) => (
            <tr key={id}>
              {headersMemo.map(({ name, isBoolean }) => (
                <td key={`${id}-${name}`}>
                  {name === 'status' ? (
                    <select
                      className="status-dropdown"
                      value={report.status || ''}
                      onChange={(e) => handleStatusChange(id, e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Complete">Complete</option>
                    </select>
                  ) : isBoolean ? (
                    report[name] ? 'True' : 'False'
                  ) : (
                    report[name] || ''
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <nav>
        <ul className="pagination">
          {pageNumbers.map(number => (
            <li key={number} className="page-item">
              <a onClick={() => paginate(number)} className="page-link">
                {number}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default ReportDisplay;
