// CreateContestPage.js
import React from 'react';
import CreateContestForm from './CreateContestForm'; // Assuming you have this component

const CreateContestPage = () => {
  const handleSaveContest = (formData) => {
    // Logic to save formData to Firebase
    console.log('Form Data:', formData);
    // Redirect or show a success message
  };

  return (
    <div>
      <h1>Create a New Contest</h1>
      <CreateContestForm onSave={handleSaveContest} />
    </div>
  );
};

export default CreateContestPage;
