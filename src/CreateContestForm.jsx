import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

const CreateContestForm = ({ onSave }) => {
  const [contestStructure, setContestStructure] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const contestRef = ref(database, 'CONTESTS');
    onValue(contestRef, (snapshot) => {
      const structure = snapshot.val();
      if (structure) {
        setContestStructure(Object.keys(structure));
        setFormData(Object.keys(structure).reduce((acc, key) => ({ ...acc, [key]: '' }), {}));
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {contestStructure.map(field => (
        <label key={field}>
          {field}:
          <input 
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            required
          />
        </label>
      ))}
      <button type="submit">Create Contest</button>
    </form>
  );
};

export default CreateContestForm;
