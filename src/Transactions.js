import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Attempting to fetch transactions data...');
    const transactionsRef = ref(database, '/TRANSCATION_HISTORY');
    onValue(transactionsRef, (snapshot) => {
      const transactionsData = snapshot.val();
      console.log('Fetched Transactions Data:', transactionsData); // Debugging log
      if (transactionsData) {
        setTransactions(transactionsData);
      } else {
        console.warn('No transactions data found at TRANSACTION_HISTORY');
        setTransactions({});
      }
      setLoading(false);
    }, (errorObject) => {
      console.error('Firebase Error:', errorObject); // Debugging log
      setError(errorObject.message);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading transactions...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="transactions-container">
      <h2>Transaction History</h2>
      {Object.entries(transactions).length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        Object.entries(transactions).map(([phoneNumber, userTransactions]) => (
          <div key={phoneNumber} className="user-transactions">
            <h3>Phone Number: {phoneNumber}</h3>
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer Name</th>
                  <th>Customer Email</th>
                  <th>Amount</th>
                  <th>Invoice Date</th>
                  <th>Invoice Number</th>
                  <th>Transaction Title</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(userTransactions).map(([transactionId, transaction]) => (
                  <tr key={transactionId}>
                    <td>{transactionId}</td>
                    <td>{transaction.CustomerName}</td>
                    <td>{transaction.CustomerEmail}</td>
                    <td>{transaction.Amount}</td>
                    <td>{transaction.InvoiceDate}</td>
                    <td>{transaction.InvoiceNumber}</td>
                    <td>{transaction.TranscationTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default Transactions;
