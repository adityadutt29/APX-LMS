"use client"
import React, { useEffect, useState, useCallback } from 'react'
import QuestionsSection from './_components/QuestionsSection';
import RecordAnswerSection from './_components/RecordAnswerSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function StartInterview({params}) {
  const [vivaData, setVivaData] = useState();
  const [vivaQuestions, setVivaQuestions] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    GetVivaDetails();
  }, []);

  /**
   * Used to Get Viva Details by MockId
   */
  const GetVivaDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Try to fetch from backend first
        const response = await fetch(`http://localhost:5001/api/viva/${params.interviewId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const viva = data.viva;
            let questions = [];
            if (typeof viva.jsonMockResp === 'string') {
              questions = JSON.parse(viva.jsonMockResp);
            } else if (viva.questions) {
              questions = viva.questions;
            }
            setVivaQuestions(questions);
            setVivaData(viva);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch from backend, trying localStorage:', error);
    }

    // Fallback to localStorage
    const vivaData = localStorage.getItem('viva_' + params.interviewId);
    if (vivaData) {
      const data = JSON.parse(vivaData);
      const jsonMockResp = JSON.parse(data.jsonMockResp);
      setVivaQuestions(jsonMockResp);
      setVivaData(data);
    } else {
      console.error('Viva not found in localStorage either');
    }
  }

  // Callback to handle auto-next after answer submission
  const handleAnswerSubmitted = useCallback(() => {
    if (activeQuestionIndex < (vivaQuestions?.length || 0) - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
    // If last question, do nothing (user can click End Viva)
  }, [activeQuestionIndex, vivaQuestions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">

        <div className='grid grid-cols-1 md:grid-cols-2 gap-12 mb-10'>
          {/*Questions */}
          <QuestionsSection 
            mockInterviewQuestion={vivaQuestions}
            activeQuestionIndex={activeQuestionIndex}
          />
          
          {/* Video/Audio Recording */}
          <RecordAnswerSection
            mockInterviewQuestion={vivaQuestions}
            activeQuestionIndex={activeQuestionIndex}
            interviewData={vivaData}
            onAnswerSubmitted={handleAnswerSubmitted}
          />
        </div>
        
        {/* Navigation Controls */}
        <div className='flex justify-center items-center gap-8 mt-12 bg-white p-8 rounded-xl shadow-lg'>
          {activeQuestionIndex > 0 &&
            <Button variant="outline" onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}>Previous Question</Button>}
          
          <div className="text-sm text-gray-500">
            Question {activeQuestionIndex + 1} of {vivaQuestions?.length || 0}
          </div>
          
          {activeQuestionIndex != vivaQuestions?.length - 1 &&
            <Button onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}>Next Question</Button>}
          {activeQuestionIndex == vivaQuestions?.length - 1 &&
            <Link href={'/classroom/vivaone/' + vivaData?.mockId + "/feedback"}>
              <Button className="bg-green-500 hover:bg-green-600">End Viva</Button>
            </Link>}
        </div>
      </div>
    </div>
  )
}

export default StartInterview