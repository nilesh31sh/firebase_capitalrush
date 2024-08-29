import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Ensure db is correctly exported from your firebase configuration
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Transactions.css';

// Enum mapping for transaction types
const TRANSACTION_TYPE_MAP = {
  0: { text: 'Amount Added', color: 'darkgreen', bgColor: 'lightgreen' },
  1: { text: 'Transaction Failed', color: 'red', bgColor: 'lightpink' },
  2: { text: 'Contest Won', color: 'blue', bgColor: 'darkgrey' },
  3: { text: 'Withdraw', color: 'yellow', bgColor: 'darkgrey' },
  4: { text: 'Null', color: 'grey', bgColor: 'lightgrey' }
};

// Date threshold for amount adjustment
const DATE_THRESHOLD = new Date('2024-08-30T00:00:00Z');

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPhoneNumbers = async () => {
      try {
        const usersCollection = collection(db, 'USERS');
        const usersSnapshot = await getDocs(usersCollection);
        const phoneNumbers = usersSnapshot.docs.map(doc => doc.id);

        if (phoneNumbers.length > 0) {
          await fetchAllTransactions(phoneNumbers);
        } else {
          setLoading(false);
          setTransactions([]);
        }
      } catch (error) {
        setError('Failed to load phone numbers');
        setLoading(false);
      }
    };

    const fetchAllTransactions = async (phoneNumbers) => {
      try {
        // Fetch all transactions in parallel
        const transactionsData = await Promise.all(
          phoneNumbers.map(async (phoneNumber) => {
            const transactionsCollection = collection(db, 'TRANSCATION_HISTORY', phoneNumber, phoneNumber);
            const querySnapshot = await getDocs(transactionsCollection);
            return querySnapshot.docs.map(doc => ({
              phoneNumber,
              id: doc.id,
              ...doc.data()
            }));
          })
        );

        // Flatten the array of arrays into a single array
        const allTransactions = transactionsData.flat();
        setTransactions(allTransactions);
        setLoading(false);
      } catch (error) {
        setError('Failed to load transactions');
        setLoading(false);
      }
    };

    fetchPhoneNumbers();
  }, []);

  const handleDelete = async (phoneNumber, transactionId) => {
    try {
      const transactionDocRef = doc(db, 'TRANSCATION_HISTORY', phoneNumber, phoneNumber, transactionId);
      await deleteDoc(transactionDocRef);
      console.log('Transaction deleted:', transactionId);

      // Remove the deleted transaction from the state
      setTransactions(prevTransactions =>
        prevTransactions.filter(tx => tx.id !== transactionId || tx.phoneNumber !== phoneNumber)
      );
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  const formatAmount = (amount, type) => {
    if (type === 1) { // If transaction type is failed
      return (parseInt(amount) / 100).toString(); // Divide amount by 100
    }
    return amount.toString(); // Ensure all amounts are in string format
  };

  const getStatusStyles = (type) => {
    const status = TRANSACTION_TYPE_MAP[type] || TRANSACTION_TYPE_MAP[4];
    // Apply dark grey background only for specific text colors
    const bgColor = (status.color === 'blue' || status.color === 'yellow') ? 'darkgrey' : status.bgColor;
    return {
      color: status.color,
      backgroundColor: bgColor,
      padding: '5px',
      borderRadius: '4px'
    };
  };

  if (loading) return <div className="loading">Loading transactions...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="transactions-container">
      <h2>Transaction History</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Transaction ID</th>
              <th>Customer Name</th>
              <th>Customer Email</th>
              <th>Amount</th>
              <th>Invoice Date</th>
              <th>Invoice Number</th>
              <th>Transaction Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{transaction.phoneNumber}</td>
                <td>{transaction.id}</td>
                <td>{transaction.CustomerName}</td>
                <td>{transaction.CustomerEmail}</td>
                <td>{formatAmount(transaction.Amount, transaction._TranscationType)}</td>
                <td>{transaction.InvoiceDate}</td>
                <td>{transaction.InvoiceNumber}</td>
                <td>{transaction.TranscationTitle}</td>
                <td>
                  <span style={getStatusStyles(transaction._TranscationType)}>
                    {TRANSACTION_TYPE_MAP[transaction._TranscationType]?.text || 'Unknown'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleDelete(transaction.phoneNumber, transaction.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions;
