"use client"
import React from 'react'
import AddNewInterview from './AddNewInterview'
import InterviewList from './InterviewList'

function InterviewPractice() {
  return (
    <div>
      <div className='p-10'>
        <h2 className='font-bold text-4xl'>Viva-Voce Practice</h2>
        <h2 className='text-gray-500'>Create and Start your Academic Viva Practice Sessions</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 my-5 '>
          <AddNewInterview/>
        </div>
        {/* Previous Viva List */}
        <InterviewList/>
      </div>
    </div>
  )
}

export default InterviewPractice
