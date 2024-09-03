import React, { useState, useEffect } from 'react';
import { db } from './firebase';
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

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

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

      setTransactions(prevTransactions =>
        prevTransactions.filter(tx => tx.id !== transactionId || tx.phoneNumber !== phoneNumber)
      );
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  const formatAmount = (amount, type) => {
    if (type === 1) {
      return (parseInt(amount) / 100).toString();
    }
    return amount.toString();
  };

  const getStatusStyles = (type) => {
    const status = TRANSACTION_TYPE_MAP[type] || TRANSACTION_TYPE_MAP[4];
    const bgColor = (status.color === 'blue' || status.color === 'yellow') ? 'darkgrey' : status.bgColor;
    return {
      color: status.color,
      backgroundColor: bgColor,
      padding: '5px',
      borderRadius: '4px'
    };
  };

  const parseDate = (dateString) => {
    // Try to handle various known formats
    const formats = [
      { regex: /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/, map: (d) => `${d[3]}-${d[2]}-${d[1]}T${d[4]}:${d[5]}:${d[6]}` },
      { regex: /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/, map: (d) => `${d[3]}-${d[2]}-${d[1]}T${d[4]}:${d[5]}:${d[6]}` },
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/, map: (d) => new Date(`${d[3]}-${d[1].padStart(2, '0')}-${d[2].padStart(2, '0')} ${d[4].padStart(2, '0')}:${d[5]}:${d[6]} ${d[7]}`).toISOString() }
    ];

    for (const { regex, map } of formats) {
      const match = dateString.match(regex);
      if (match) {
        return new Date(map(match));
      }
    }

    // Fallback: attempt to parse any other format
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const formatDisplayDate = (dateString) => {
    const date = parseDate(dateString);
    if (!date) {
      return `Invalid Date (Original: ${dateString})`;
    }
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const sortTransactionsByDate = () => {
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = parseDate(a.InvoiceDate);
      const dateB = parseDate(b.InvoiceDate);
      if (dateA && dateB) {
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    setTransactions(sortedTransactions);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
              <th>
                Invoice Date
                <br />
                <button onClick={sortTransactionsByDate} className="sort-button">
                  Sort {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </th>
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
                <td>{formatDisplayDate(transaction.InvoiceDate)}</td>
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
