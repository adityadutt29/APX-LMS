"use client"
import { Button } from '@/components/ui/button'
import { Lightbulb, WebcamIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'

function VivaSession({params}) {
  const [vivaData, setVivaData] = useState(null);
  const [webCamEnabled, setWebCamEnabled] = useState(false);

  useEffect(() => {
    GetVivaDetails();
  }, [params.interviewId]);

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
            setVivaData(data.viva);
            localStorage.setItem('viva_' + params.interviewId, JSON.stringify(data.viva));
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
      setVivaData(JSON.parse(vivaData));
    } else {
      console.error('Viva not found in localStorage either');
    }
  }

  return (
    <div className='p-8'>
      <h2 className='font-bold text-3xl mb-8 text-gray-800'>Let's Get Started</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
        {vivaData ? (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col p-8 rounded-xl border-2 border-gray-200 gap-6 bg-white shadow-lg'>
              <h2 className='text-lg'><strong className='text-blue-600'>Subject:</strong> <span className='text-gray-700'>{vivaData.subject}</span></h2>
              <h2 className='text-lg'><strong className='text-blue-600'>Topics:</strong> <span className='text-gray-700'>{vivaData.topics}</span></h2>
              <h2 className='text-lg'><strong className='text-blue-600'>Difficulty:</strong> <span className='text-gray-700'>{vivaData.difficulty}</span></h2>
            </div>
            <div className='p-8 border-2 rounded-xl border-yellow-300 bg-yellow-50 shadow-lg'>
              <h2 className='flex gap-3 items-center text-yellow-600 text-lg mb-4'><Lightbulb size={24}/><strong>Information</strong></h2>
              <h2 className='text-yellow-700 leading-relaxed'>{process.env.NEXT_PUBLIC_INFORMATION}</h2>
            </div>
          </div>
        ) : (
          <div className='text-lg p-8 bg-gray-100 rounded-xl'>Loading viva details...</div>
        )}
        <div className='flex flex-col justify-center items-center p-8 bg-white rounded-xl shadow-lg'>
          <div className='relative bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-4'>
            {webCamEnabled ? (
              <Webcam
                onUserMedia={() => setWebCamEnabled(true)}
                onUserMediaError={() => setWebCamEnabled(false)}
                mirrored={true}
                style={{
                  height: 320,
                  width: 320,
                  borderRadius: '8px'
                }}
              />
            ) : (
              <WebcamIcon className='h-72 w-full p-12 text-gray-400' />
            )}
          </div>
          {!webCamEnabled && (
            <Button 
              variant="ghost" 
              className="w-full py-4 text-base mt-4" 
              onClick={() => setWebCamEnabled(true)}
            >
              Enable Web Cam and Microphone
            </Button>
          )}
        </div>
      </div>
      <div className='flex justify-end items-end mt-12'>
        <Link href={'/classroom/vivaone/' + params.interviewId + '/start'}>
          <Button className="px-8 py-4 text-base font-medium">Start Viva</Button>
        </Link>
      </div>
    </div>
  )
}

export default VivaSession