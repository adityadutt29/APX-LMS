"use client"
import { useState } from 'react';
import { Plus, BookOpen, Users, Calendar, Check, X } from 'lucide-react';

export default function JoinCourse() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setMessage('Please enter a valid course code');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login first');
        setMessageType('error');
        setLoading(false);
        return;
      }

  const response = await fetch('http://localhost:5001/api/courses/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join course');
      }
      
      setMessage(`Successfully joined "${data.data.title}"!`);
      setMessageType('success');
      setJoinCode('');
      
      // Refresh the page after a short delay to show updated courses
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error joining course:', error);
      setMessage(error.message || 'Failed to join course. Please check the course code.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-blue-200 flex items-center justify-center shadow-lg">
            <Plus className="text-3xl font-bold text-green-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-1">Join a <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">New Course</span>!</h2>
            <p className="text-gray-500 text-lg">Enter your course code to get started</p>
          </div>
        </div>
      </div>

      {/* Join Course Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 border border-blue-100 shadow-sm">
          <form onSubmit={handleJoinCourse} className="space-y-6">
            <div>
              <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <input
                type="text"
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter course code (e.g., ABC123)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono tracking-wider"
                disabled={loading}
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask your teacher for the course code
              </p>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {messageType === 'success' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Joining Course...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Join Course
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
