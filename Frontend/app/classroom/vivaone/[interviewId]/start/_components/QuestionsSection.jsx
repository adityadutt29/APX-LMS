import React from 'react';

function QuestionsSection({ mockInterviewQuestion, activeQuestionIndex }) {
  if (!mockInterviewQuestion || !mockInterviewQuestion.length) {
    return <div className="p-8 bg-gray-100 rounded-xl">No questions available.</div>;
  }

  return (
    <div className='p-8 border rounded-xl my-8 bg-white shadow-lg'>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8'>
        {mockInterviewQuestion.map((question, index) => (
          <h2
            key={index}
            className={`p-4 border rounded-full text-sm text-center cursor-pointer transition-all duration-300
            ${activeQuestionIndex === index ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            Question #{index + 1}
          </h2>
        ))}
      </div>
      <div className='flex items-start gap-4 mb-8'>
        <h2 className='text-lg md:text-xl font-semibold text-gray-900 leading-relaxed flex-1'>
          {mockInterviewQuestion[activeQuestionIndex]?.question}
        </h2>
      </div>
    </div>
  );
}

export default QuestionsSection;
