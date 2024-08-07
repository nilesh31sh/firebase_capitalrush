import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Ensure `db` is exported from your firebase configuration file
import { collection, getDocs } from 'firebase/firestore';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Attempting to fetch transactions data...');

    const fetchTransactions = async () => {
      try {
        const transactionHistoryCollection = collection(db, 'TRANSCATION_HISTORY');
        const phoneNumberSnapshot = await getDocs(transactionHistoryCollection);
        
        if (phoneNumberSnapshot.empty) {
          console.warn('No phone numbers found in TRANSACTION_HISTORY');
          setTransactions({});
          setLoading(false);
          return;
        }

        const transactionsData = {};

        for (const phoneNumberDoc of phoneNumberSnapshot.docs) {
          const phoneNumber = phoneNumberDoc.id;
          console.log(`Fetching transactions for phone number: ${phoneNumber}`);
          
          const userTransactionsCollection = collection(db, 'TRANSCATION_HISTORY', phoneNumber, phoneNumber);
          const userTransactionsSnapshot = await getDocs(userTransactionsCollection);

          const userTransactions = userTransactionsSnapshot.docs.reduce((acc, transactionDoc) => {
            acc[transactionDoc.id] = transactionDoc.data();
            return acc;
          }, {});

          transactionsData[phoneNumber] = userTransactions;
        }

        console.log('Fetched Transactions Data:', transactionsData); // Debugging log
        setTransactions(transactionsData);
      } catch (errorObject) {
        console.error('Firestore Error:', errorObject); // Debugging log
        setError(errorObject.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
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
