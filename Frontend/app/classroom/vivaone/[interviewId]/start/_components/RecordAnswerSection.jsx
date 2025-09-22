"use client";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Mic, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData, onAnswerSubmitted }) {
    const [userAnswer, setUserAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [micPermission, setMicPermission] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognition = useRef(null);

    useEffect(() => {
        // Check for microphone permissions explicitly
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => setMicPermission(true))
            .catch(() => {
                setMicPermission(false);
                toast.error("Microphone access denied. Please enable it in browser settings.");
            });

        // Detect if Web Speech API is available
        const isSpeechRecognitionAvailable = () => {
            const impl = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;
            const isAvailable = !!impl;
            console.log('SpeechRecognition available:', isAvailable, 'Implementation:', impl);
            return isAvailable;
        };

        if (isSpeechRecognitionAvailable()) {
            const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;
            recognition.current = new SpeechRecognitionImpl();
            recognition.current.continuous = true;
            recognition.current.interimResults = true;

            recognition.current.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setUserAnswer(prevAns => prevAns + ' ' + event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognition.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                toast.error("Speech recognition error: " + event.error);
                setIsRecording(false);
            };

            recognition.current.onend = () => {
                setIsRecording(false);
            };
        } else {
            toast.error("Speech recognition is not supported in this browser.");
        }
    }, []);

    const startRecording = () => {
        if (!micPermission) {
            toast.error("Microphone access is required for recording.");
            return;
        }

        if (recognition.current) {
            setUserAnswer('');
            recognition.current.start();
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        if (recognition.current) {
            recognition.current.stop();
            setIsRecording(false);
        }
    };

    const StartStopRecording = () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    };

    // Function to save user answer and get feedback
    const UpdateUserAnswer = async () => {
        console.log("User Answer:", userAnswer);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Please login to submit answers");
                setLoading(false);
                return;
            }

            // Try to submit to backend first
            const response = await fetch(`http://localhost:5001/api/viva/${interviewData?.mockId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: mockInterviewQuestion[activeQuestionIndex]?.question,
                    correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
                    userAns: userAnswer
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Answer submitted to backend:', data);
                    toast.success("Answer submitted successfully");
                    setUserAnswer('');
                    setLoading(false);
                    if (typeof onAnswerSubmitted === 'function') {
                        onAnswerSubmitted();
                    }
                    return;
                }
            }

            // Fallback to localStorage if backend fails
            console.log('Backend submission failed, saving to localStorage');
            
        } catch (error) {
            console.error('Error submitting to backend:', error);
        }

        // Fallback: Store data in localStorage
        try {
            const answerData = {
                mockIdRef: interviewData?.mockId,
                question: mockInterviewQuestion[activeQuestionIndex]?.question,
                correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
                userAns: userAnswer,
                feedback: "Feedback will be available after backend processing",
                rating: "Pending",
                userEmail: JSON.parse(localStorage.getItem('user'))?.email || "user@example.com",
                createdAt: moment().format('DD-MM-YYYY')
            };

            // Store in localStorage
            const existingAnswers = JSON.parse(localStorage.getItem('userAnswers_' + interviewData?.mockId) || '[]');
            existingAnswers.push(answerData);
            localStorage.setItem('userAnswers_' + interviewData?.mockId, JSON.stringify(existingAnswers));

            toast.success("Answer saved locally");
            setUserAnswer('');
            if (typeof onAnswerSubmitted === 'function') {
                onAnswerSubmitted();
            }
        } catch (storageError) {
            console.error("Storage error:", storageError);
            toast.error("Failed to save answer.");
        }

        setLoading(false);
    };

    useEffect(() => {
        if (!isRecording && userAnswer.length > 10) {
            UpdateUserAnswer();
        }
    }, [isRecording, userAnswer]);

    return (
        <div className='flex items-center justify-center flex-col p-8 bg-white rounded-xl shadow-lg my-8'>
            {/* Webcam Section */}
            <div className='relative bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border-4 border-gray-300 shadow-2xl mb-8'>
                {/* Background Frame */}
                <div className='absolute inset-4 rounded-lg border-2 border-gray-600 opacity-30'></div>
                <Image 
                    src={'/webcam.png'} 
                    width={200} 
                    height={200} 
                    className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20' 
                    alt="Webcam Background" 
                />
                <Webcam
                    mirrored={true}
                    style={{
                        height: 320,
                        width: 400,
                        zIndex: 10,
                        borderRadius: '8px',
                        border: '2px solid rgba(255,255,255,0.1)',
                    }}
                />
            </div>

            {/* Recording Button */}
            <Button
                disabled={loading || !micPermission}
                variant="outline"
                className="px-8 py-4 text-base font-medium"
                onClick={StartStopRecording}
            >
                {isRecording ? (
                    <h2 className='flex text-red-600 gap-3 animate-pulse items-center text-base'>
                        <StopCircle size={20} /> Stop Recording
                    </h2>
                ) : (
                    <h2 className='flex text-center gap-3 items-center text-base'>
                        <Mic size={20} /> Record Answer
                    </h2>
                )}
            </Button>
        </div>
    );
}

export default RecordAnswerSection;