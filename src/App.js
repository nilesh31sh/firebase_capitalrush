
import React, { useState } from 'react';
import Sidebar from './Sidebar'; // Import the Sidebar component
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ContestDisplay from './ContestDisplay';
import ContestantsView from './ContestantsView';
import UserDisplay from './UsersDisplay'; 
import UserContestsView from './UserContestsView';
import CreateContestPage from './CreateContestPage';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
        <div className="app-content">
          <button className="toggle-button" onClick={toggleSidebar}>
            {isSidebarOpen ? '←' : '→'}
          </button>
          <Routes>
            <Route path="/contests" element={<ContestDisplay />} />
            <Route path="/contests/:contestId" element={<ContestantsView />} />
            <Route path="/users" element={<UserDisplay />} />
            <Route path="/users/:userId/:contestType" element={<UserContestsView />} />
            <Route path="/create-contest" element={<CreateContestPage />} />
            {/* Add other routes as necessary */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
