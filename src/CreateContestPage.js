import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, set, get } from 'firebase/database';
import './ContestForm.css';


const CreateContestForm = () => {
  const initialFormData = {
    //contest id is generated automatically but dosnt contain . or $ or [ or ]
    ContestID: new Date().toISOString().split('.')[0],
    duration: 0,
    entryFee: '',
    matchType: '',
    slots: '',
    startTime: '',
    FirstPrize: '',
    SecondPrize: '',
    ThirdPrize: '',
    FourthPrize: '',
    FifthPrize: '',
    prizePool: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [message, setMessage] = useState('');
  const [slotsError, setSlotsError] = useState('');

  useEffect(() => {
    calculatePrizes();
  },);

  const calculatePrizes = () => {
    if (!formData.slots || !formData.entryFee) return;

    const prizePool = formData.slots * formData.entryFee;
    formData.prizePool = prizePool;

    if (formData.slots <= 10) {
      formData.FirstPrize = Math.floor(prizePool * 0.5 * 0.7);
      formData.SecondPrize = Math.floor(prizePool * 0.3 * 0.7);
      formData.ThirdPrize = formData.FourthPrize = formData.FifthPrize = 20;
    } else if (formData.slots >= 11 && formData.slots <= 50) {
      formData.FirstPrize = Math.floor(prizePool * 0.40 * 0.7);
      formData.SecondPrize = Math.floor(prizePool * 0.20 * 0.7);
      formData.ThirdPrize = Math.floor(prizePool * 0.11 * 0.7);
      formData.FourthPrize = Math.floor(prizePool * 0.04 * 0.7);
      formData.FifthPrize = 28;
    } else if (formData.slots >= 51) {
      formData.FirstPrize = Math.floor(prizePool * 0.35 * 0.7);
      formData.SecondPrize = Math.floor(prizePool * 0.15 * 0.7);
      formData.ThirdPrize = Math.floor(prizePool * 0.11 * 0.7);
      formData.FourthPrize = Math.floor(prizePool * 0.04 * 0.7);
      formData.FifthPrize = 34;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'slots') {
      const intValue = parseInt(value, 10) || 0;
      setFormData({ ...formData, [name]: intValue });
      if (intValue < 10 || intValue > 500) {
        setSlotsError('Slots must be between 10 and 500');
      } else {
        setSlotsError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (name === 'slots' || name === 'entryFee' || name === 'duration') {
      // Remove leading zeros by converting to a number and back to a string
      const strippedValue = value ? String(Number(value)) : '';
  
      // Update the state with the stripped value
      setFormData({ ...formData, [name]: strippedValue });
    } else {
      // Handle other fields normally
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.slots < 10 || formData.slots > 500) {
      setSlotsError('Slots must be between 10 and 500');
      return;
    }

    const ContestIDRef = ref(database, `CONTESTS/${formData.ContestID}`);
    const snapshot = await get(ContestIDRef);
    if (snapshot.exists()) {
      setMessage('Contest ID already exists');
    } else {
      set(ContestIDRef, formData) // Storing the formData under the specified ContestID
        .then(() => {
          setMessage('Contest created successfully');
          setFormData(initialFormData); // Reset form after submission
        })
        .catch((error) => {
          // Handle any errors that occur during set
          setMessage('Error creating contest: ' + error.message);
        });
    }
  };

  return (
    <div className="form-container">
      <h1>Create Contest</h1>
      <form onSubmit={handleSubmit}>
        <label className="form-field">
          Contest ID:
          <input
            type="text"
            name="ContestID"
            value={formData.ContestID}
            readOnly
            className="form-input"
          />
        </label>

        <label className="form-field">
          Duration (Hours):
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>



        <label className="form-field">
          Match Type:
          <select
            name="matchType"
            value={formData.matchType}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select Match Type</option>
            <option value="Mahasangram">Mahasangram</option>
            <option value="Gold_gala">Gold Gala</option>
            <option value="Silver_gala">Silver Gala</option>
            <option value="Quick_Gainer_Challenge">Quick Gainer Challenge</option>
            <option value="PracticeMatch">Practice Match</option>
            {/* Add your match type options here */}
          </select>
        </label>


        <label className="form-field">
          Start Time (DateTime):
          <input
            type="datetime-local"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>
        <label className="form-field">
          Slots (10 to 500):
          <input
            type="number"
            name="slots"
            value={formData.slots}
            onChange={handleChange}
            className="form-input"
          />
          {slotsError && <p className="error-message">{slotsError}</p>}
        </label>

        <label className="form-field">
          Entry Fee:
          <input
            type="number"
            name="entryFee"
            value={formData.entryFee}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>


        <div className="prizes-container">
          <h3>Prize Distribution</h3>
          <p>Prize Pool: {formData.slots * formData.entryFee}</p>

          <p>First Prize: {formData.FirstPrize}</p>
          <p>Second Prize: {formData.SecondPrize}</p>
          <p>Third Prize: {formData.ThirdPrize}</p>
          <p>Fourth Prize: {formData.FourthPrize}</p>
          <p>Fifth Prize: {formData.FifthPrize}</p>
        </div>

        <button type="submit" className="form-submit">Create Contest</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default CreateContestForm;
