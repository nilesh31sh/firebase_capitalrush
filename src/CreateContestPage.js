import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import Papa from 'papaparse'; // Ensure papaparse is installed
import './ContestForm.css';
import { Timestamp } from 'firebase/firestore';

const CreateContestForm = () => {
  const [formData, setFormData] = useState({
    Duration: 0,
    EntryFee: '',
    MatchType: '',
    Slots: '',
    StartTime: '',
    FirstPrize: '',
    SecondPrize: '',
    ThirdPrize: '',
    FourthPrize: '',
    FifthPrize: '',
    PrizePoolPlatformFees: '',
    Contestants: [],
    botIndexUsed: [],
    PrizePoolToShow: '',
    ended: false,
    PrizePoolSuggested: '',
    numberOfBots: 0,
    ContestName: '',
  });
  const [message, setMessage] = useState('');
  const [slotsError, setSlotsError] = useState('');
  const [contestCount, setContestCount] = useState(1); // For contest numbering

  useEffect(() => {
    calculatePrizes();
  }, [formData.Slots, formData.EntryFee, formData.PrizePoolSuggested]);

  useEffect(() => {
    calculateNumberofBots();
  }, [formData.Slots, formData.EntryFee]);


  const calculateNumberofBots = () => {
    const rangeStart = formData.Slots / 3;
    const rangeEnd = formData.Slots;
    formData.numberOfBots = Math.floor(rangeStart + Math.random() * (rangeEnd - rangeStart));
  };


  const calculatePrizes = () => {
    if (!formData.Slots || !formData.EntryFee || !formData.PrizePoolSuggested) return;

    const PrizePoolSuggested = formData.PrizePoolSuggested;
    setFormData(prevFormData => ({
      ...prevFormData,
      PrizePoolSuggested: PrizePoolSuggested,
      FirstPrize: calculatePrize(PrizePoolSuggested, 1),
      SecondPrize: calculatePrize(PrizePoolSuggested, 2),
      ThirdPrize: calculatePrize(PrizePoolSuggested, 3),
      FourthPrize: calculatePrize(PrizePoolSuggested, 4),
      FifthPrize: calculatePrize(PrizePoolSuggested, 5),
    }));
  };

  const calculatePrize = (PrizePool, position) => {
    if (formData.Slots <= 10) {
      if (position === 1) return Math.round(PrizePool * 0.5 / 10) * 10;
      if (position === 2) return Math.round(PrizePool * 0.3 / 10) * 10;
      if (position === 3) return Math.round(PrizePool * 0.2 / 10) * 10;
      else return 0;
    } else if (formData.Slots >= 11 && formData.Slots <= 50) {
      if (position === 1) return Math.round(PrizePool * 0.50 / 10) * 10;
      if (position === 2) return Math.round(PrizePool * 0.30 / 10) * 10;
      if (position === 3) return Math.round(PrizePool * 0.1 / 10) * 10;
      if (position === 4) return Math.round((PrizePool * (0.1/7)) / 10) * 10;
      if (PrizePool < 10000) return 10;
      else return 20;
    } else if (formData.Slots >= 51) {
      if (position === 1) return Math.round(PrizePool * 0.45 / 10) * 10;
      if (position === 2) return Math.round(PrizePool * 0.25 / 10) * 10;
      if (position === 3) return Math.round(PrizePool * 0.1 / 10) * 10;
      if (position === 4) return Math.round((PrizePool * (0.2/7)) / 10) * 10;
      if (PrizePool < 10000) return 10;
      else return 20;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevFormData => {
      let updatedValue = value;
      if (['Slots', 'Duration', 'EntryFee', 'PrizePoolSuggested', 'PrizePoolPlatformFees'].includes(name)) {
        const intValue = parseInt(value, 10);
        updatedValue = Number.isNaN(intValue) ? '' : String(intValue);
        if (name === 'Slots' && (intValue < 10 || intValue > 2001)) {
          setSlotsError('Slots must be between 10 and 2001');
        } else if (name === 'Slots') {
          setSlotsError('');
        }
      } else if (name === 'StartTime') {
        updatedValue = value.replace('T', ' ') + ':00';
      }

      const newFormData = {
        ...prevFormData,
        [name]: updatedValue,
      };

      if (name === 'StartTime') {
        let manualId = value.replace(/[-T:]/g, ''); // Removes '-', 'T', and ':' from the string
        manualId += '00';
        newFormData.ManualContestID = manualId;
      }
      if (name === 'MatchType' || name === 'ManualContestID' || name === 'StartTime') {
        newFormData.ContestID = `${newFormData.MatchType}_CONTEST_${newFormData.ManualContestID}`;
      }
      if (name === 'Slots' || name === 'EntryFee' || name === 'PrizePoolPlatformFees') {
        newFormData.PrizePoolToShow = Math.round(newFormData.Slots * newFormData.EntryFee * ((100-newFormData.PrizePoolPlatformFees)/100));
      }

      return newFormData;
    });
  };

  const handleBlur = () => {
    setFormData(prevFormData => ({
      ...prevFormData,
      EntryFee: prevFormData.EntryFee ? Math.round(prevFormData.EntryFee / 10) * 10 : ''
    }));
  };
  const pickRandomUsers = async (ContestID, callback) => {
    const response = await fetch('/UserName.csv');
    const text = await response.text();
    const users = text.split(/\r?\n/);

    //const numberOfBots = Math.floor(Math.random() * (formData.Slots - formData.Slots / 3) + formData.Slots / 3);

    const selectedUsers = [];
    const selectedIndices = [];
    const IndicesLeft = Array.from({ length: users.length - 1 }, (_, i) => i);

    while (IndicesLeft.length > 0 && selectedIndices.length < formData.numberOfBots) {
      const randomIndex = Math.floor(Math.random() * IndicesLeft.length);
      selectedIndices.push(IndicesLeft[randomIndex]);
      IndicesLeft.splice(randomIndex, 1);
      selectedUsers.push(createUserObject(users[selectedIndices[selectedIndices.length - 1]], ContestID, formData.EntryFee));
    }

    setFormData(prevFormData => {
      const newFormData = { ...prevFormData, botIndexUsed: selectedIndices };
      callback(newFormData);
      return newFormData;
    });

    return { selectedUsers };
  };

  const createUserObject = (username, ContestID, EntryFee) => {
    let portfolioTarget = 300000; // Default portfolio target
    
    // Determine portfolio target based on MatchType and EntryFee
    if (formData.MatchType === 'Mahasangram' || formData.MatchType === 'Gold_Gala' || formData.MatchType === 'Silver_Summit' || formData.MatchType === 'Quick_Gainer_Challenge') {
      if (EntryFee === 1000 || EntryFee === 500 || EntryFee === 250) {
        portfolioTarget = 400000; // Set for higher entry fees
      } else if (EntryFee === 200 || EntryFee === 100 || EntryFee === 50) {
        portfolioTarget = 300000; // Set for lower entry fees
      }
    }
    
    return {
      Name: username,
      Email: username + '@gmail.com',
      Score: Math.floor(Math.random() * (portfolioTarget - 50000) + 50000), // Bot score based on portfolio target
      ContestID,
      Tickets: 0,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { ManualContestID, botIndexUsed, ...dataToSubmit } = formData;
  
    if (!dataToSubmit.ContestID) {
      setMessage('Please enter a Contest ID');
      return;
    }
    if (dataToSubmit.Slots < 10 || dataToSubmit.Slots > 2001) {
      setSlotsError('Slots must be between 10 and 2001');
      return;
    }
  
    const formattedStartTime = formatDate(new Date(dataToSubmit.StartTime.replace('T', ' ')));
    const endTime = new Date(new Date(dataToSubmit.StartTime.replace('T', ' ')).getTime() + dataToSubmit.Duration * 60 * 60 * 1000);
  
    const contestEndTime = Timestamp.fromDate(endTime);
  
    setMessage('Selecting bots; please wait...');
    const { selectedUsers } = await pickRandomUsers(dataToSubmit.ContestID, async (updatedFormData) => {
      setMessage('Trying to Store contest; please wait...');
      const contestRef = doc(db, 'CONTESTS', updatedFormData.ContestID);
      const snapshot = await getDoc(contestRef);
      if (snapshot.exists()) {
        setMessage('Contest ID already exists');
      } else {
        await setDoc(contestRef, {
          ...updatedFormData,
          Contestants: [],
          StartTime: formattedStartTime,
          EndTime: formatDate(endTime),
          ContestEndTime: contestEndTime,
        });
  
        const contestantsCollectionRef = collection(db, 'CONTESTS', updatedFormData.ContestID, 'Contestants');
        selectedUsers.forEach(async (user) => {
          const contestantRef = doc(contestantsCollectionRef, user.Email);
          await setDoc(contestantRef, user);
        });
  
        setMessage('Contest created successfully');
        setFormData({ ...updatedFormData, Contestants: [] });
        setContestCount(contestCount + 1);
      }
    });
  };
  

  function formatDate(date) {
    const pad = num => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  const calculatePortfolioTarget = () => {
    let portfolioTarget = 300000; // Default portfolio target
    
    if (formData.MatchType === 'Mahasangram' || formData.MatchType === 'Gold_Gala' || formData.MatchType === 'Silver_Summit' || formData.MatchType === 'Quick_Gainer_Challenge') {
      if (formData.EntryFee === '1000' || formData.EntryFee === '500' || formData.EntryFee === '250') {
        portfolioTarget = 400000;
      } else if (formData.EntryFee === '200' || formData.EntryFee === '100' || formData.EntryFee === '50') {
        portfolioTarget = 300000;
      }
    }
  
    return portfolioTarget;
  };

  return (
    <div className="form-container">
      <h1>Create Contest</h1>
      <form onSubmit={handleSubmit}>

        <label className="form-field">
          Contest ID:
          <input
            type="text"
            value={formData.ContestID}
            readOnly
            className="form-input"
          />
        </label>
        <label className="form-field">
          ContestName:
          <input
            type="text"
            name="ContestName"
            value={formData.ContestName}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>

        <label className="form-field">
          Duration (Hours):
          <input
            type="number"
            name="Duration"
            value={formData.Duration}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>

        <label className="form-field">
          Prize Pool Suggested:
          <input
            type="number"
            name="PrizePoolSuggested"
            value={formData.PrizePoolSuggested}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>
        <label className="form-field">
          PrizePool Platform Fees:
          <input
            type="number"
            name="PrizePoolPlatformFees"
            value={formData.PrizePoolPlatformFees}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>

        <label className="form-field">
          Match Type:
          <select
            name="MatchType"
            value={formData.MatchType}
            onChange={handleChange}
            required
            className="form-input"
          >
            <option value="">Select Match Type</option>
            <option value="Mahasangram">Mahasangram</option>
            <option value="Gold_Gala">Gold Gala</option>
            <option value="Silver_Summit">Silver Summit</option>
            <option value="Quick_Gainer_Challenge">Quick Gainer Challenge</option>
            <option value="PracticeMatch">Practice Match</option>
          </select>
        </label>

        <label className="form-field">
          Start Time (DateTime):
          <input
            type="datetime-local"
            name="StartTime"
            value={formData.StartTime}
            onChange={handleChange}
            required
            className="form-input"
          />
        </label>
        <label className="form-field">
          Slots (10 to 2001):
          <input
            type="number"
            name="Slots"
            value={formData.Slots}
            onChange={handleChange}
            className="form-input"
          />
          {slotsError && <p className="error-message">{slotsError}</p>}
        </label>
        <label className="form-field">
          Entry Fee:
          <input
            type="number"
            name="EntryFee"
            value={formData.EntryFee}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className="form-input"
          />
        </label>
        <div className="prizes-container">
          <h3>Prize Distribution</h3>
          <p>Prize Pool Suggested: {formData.PrizePoolSuggested}</p>
          <p>Number of Bots Generated: {formData.numberOfBots}</p>
          <p>First Prize: {formData.FirstPrize}</p>
          <p>Second Prize: {formData.SecondPrize}</p>
          <p>Third Prize: {formData.ThirdPrize}</p>
          <p>Fourth Prize: {formData.FourthPrize}</p>
          <p>Fifth Prize: {formData.FifthPrize}</p>
          <p>Prize Pool to Show: {formData.PrizePoolToShow}</p>
          <p>Portfolio Target: {calculatePortfolioTarget()}</p> {/* Display portfolio target */}
        </div>
        <button type="submit" className="form-submit">Create Contest</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
};

export default CreateContestForm;
