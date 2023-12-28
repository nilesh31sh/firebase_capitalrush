import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, push, child, get } from 'firebase/database';
import './ContestForm.css';

const CreateContestForm = () => {
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Assuming 'CONTESTS' is a list of contests and not keyed by unique contest IDs
    // If your structure is different, you'll need to adjust the data fetching logic accordingly
    const contestRef = ref(database, 'CONTESTS');
    onValue(contestRef, (snapshot) => {
      const contests = snapshot.val();
      if (contests) {
        // Use the first contest to determine the structure
        const firstContest = contests[Object.keys(contests)[0]];
        setFormData(Object.keys(firstContest).reduce((acc, key) => ({
          ...acc,
          [key]: '',
        }), {}));
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check if the contest with the given ID already exists
    const contestIdRef = child(ref(database), `CONTESTS/${formData.id}`);
    const snapshot = await get(contestIdRef);
    if (snapshot.exists()) {
      setMessage('Contest ID exists');
    } else {
      // Push new contest data to Firebase under a new unique key
      push(ref(database, 'CONTESTS'), formData);
      setMessage('Contest created successfully');
    }
  };

  return (
    
    <div className="form-container">
      <h1>Create Contest</h1>
      <form onSubmit={handleSubmit}>
        {formData && Object.entries(formData).map(([field, value]) => (
          <label key={field} className="form-field">
            {field}:
            <input 
              type="text" // assuming all fields should be text inputs for simplicity
              name={field}
              value={value}
              onChange={handleChange}
              required
              className="form-input"
            />
          </label>
        ))}
        <button type="submit" className="form-submit">Create Contest</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default CreateContestForm;
