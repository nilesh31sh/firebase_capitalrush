import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import './ReportDisplay.css';

const ReportDisplay = () => {
  const [reports, setReports] = useState({}); // Stores the reports keyed by their Firebase IDs
  const [headers, setHeaders] = useState([]); // Stores the headers for the table
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const reportsRef = ref(database, 'HELP_REPORT');
    onValue(reportsRef, (snapshot) => {
      const reportsData = snapshot.val();
      if (reportsData) {
        setReports(reportsData);

        // Extract all unique keys from all reports
        const allKeys = new Set(['status']); // Initialize with 'status' to ensure it's included
        Object.values(reportsData).forEach(report => {
          Object.keys(report).forEach(key => {
            allKeys.add(key);
          });
        });
        setHeaders([...allKeys]); // Convert the Set to an array and update the state
      }
      setLoading(false);
    }, (errorObject) => {
      setError(errorObject.message);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = (reportId, newStatus) => {
    // Update the status of the specific report in Firebase
    update(ref(database, `/HELP_REPORT/${reportId}`), { status: newStatus });
  };

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="report-display-container">
      <h2>Help Reports</h2>
      <table className="report-table">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(reports).map(([id, report]) => (
            <tr key={id}>
              {headers.map(header => (
                <td key={`${id}-${header}`}>
                  {header === 'status' ? (
                    <select
                      className="status-dropdown" // Add class for styling
                      value={report.status || ''}
                      onChange={(e) => handleStatusChange(id, e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Complete">Complete</option>
                    </select>
                  ) : (
                    report[header] || ''
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportDisplay;