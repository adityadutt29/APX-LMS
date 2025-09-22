"use client"
import React, { useEffect, useState } from 'react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function Feedback({params}) {

    const [feedbackList,setFeedbackList]=useState([]);
    const router=useRouter();
    useEffect(()=>{
        GetFeedback();
    },[])
    const GetFeedback=async()=>{
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Try to fetch from backend first
                const response = await fetch(`http://localhost:5001/api/viva/${params.interviewId}/feedback`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('Feedback fetched from backend:', data.answers);
                        setFeedbackList(data.answers);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch feedback from backend, trying localStorage:', error);
        }

        // Fallback to localStorage
        const feedbackData = localStorage.getItem('userAnswers_' + params.interviewId);
        if (feedbackData) {
            const result = JSON.parse(feedbackData);
            console.log('Feedback loaded from localStorage:', result);
            setFeedbackList(result);
        } else {
            console.log('No feedback found in localStorage');
        }
    }
  return (
    <div className='p-12 max-w-6xl mx-auto'>
        {feedbackList?.length==0
        ? <h2 className='font-bold text-2xl text-gray-500 text-center py-12'>No Viva Feedback found</h2>
        :
        <>
        <h2 className='text-4xl font-bold text-green-500 mb-4'>Congratulations!</h2>
        <h2 className='font-bold text-3xl text-gray-800 mb-6'>Here is your Viva feedback</h2>
        <h2 className='text-primary text-xl mb-8 p-6 bg-blue-50 rounded-xl border-l-4 border-blue-500'>
          Your overall viva rating: <strong className='text-2xl text-blue-600'>
            {feedbackList.length > 0
              ? (feedbackList.reduce((sum, item) => sum + (parseFloat(item.rating) || 0), 0) / feedbackList.length).toFixed(1)
              : 0}/10
          </strong>
        </h2>
        <h2 className='text-base text-gray-600 mb-8 leading-relaxed'>
          Find below viva questions with correct answers, your responses, and personalized feedback for improvement
        </h2>
        {feedbackList&&feedbackList.map((item,index)=>(
             <Collapsible key={index} className='mb-6'>
             <CollapsibleTrigger className='p-6 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 text-left flex justify-between gap-6 w-full'>
             <span className='text-lg font-medium text-gray-800 leading-relaxed'>{item.question}</span> 
             <ChevronsUpDown className='h-6 w-6 text-blue-500 flex-shrink-0'/>
             </CollapsibleTrigger>
             <CollapsibleContent>
               <div className='flex flex-col gap-4 mt-4'>
                <h2 className='text-red-600 p-4 border-2 border-red-200 rounded-xl bg-red-50'><strong>Rating: </strong><span className='text-xl font-bold'>{item.rating}/10</span></h2>
                <h2 className='p-4 border-2 border-red-200 rounded-xl bg-red-50 text-red-900 leading-relaxed'><strong>Your Answer: </strong>{item.userAns}</h2>
                <h2 className='p-4 border-2 border-green-200 rounded-xl bg-green-50 text-green-900 leading-relaxed'><strong>Correct Answer: </strong>{item.correctAns}</h2>
                <h2 className='p-4 border-2 border-blue-200 rounded-xl bg-blue-50 text-blue-900 leading-relaxed'><strong>Feedback: </strong>{item.feedback}</h2>
               </div>
             </CollapsibleContent>
           </Collapsible>
        ))}
        </>}
        <Button className="mt-12 px-8 py-4 text-base font-medium" onClick={()=>router.replace('/classroom')}>Go Home</Button>
    </div>
  )
}

export default Feedback