import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Mic, History as HistoryIcon } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/text-to-speech');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mic className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Speakify</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/history')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <HistoryIcon className="h-5 w-5 mr-2" />
                History
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Speakify
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Your text out loud - Making content accessible for everyone through natural voice synthesis
          </p>
        </div>

        {/* Project Cards */}
        <div className="max-w-md mx-auto">
          {/* Text to Speech Card */}
          <div
            onClick={handleCardClick}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Volume2 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Text to Speech
            </h3>
            <p className="text-gray-600 mb-6">
              Convert any text into natural-sounding speech with customizable voices,
              emotions, and languages. Perfect for visually impaired users and those who prefer audio content.
            </p>
            <div className="flex items-center text-blue-600">
              <span className="font-medium">Try it now</span>
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 