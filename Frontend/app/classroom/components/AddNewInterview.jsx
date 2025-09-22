"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoaderCircle, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function AddNewInterview() {
    const [openDialog, setOpenDialog] = useState(false);
    const [subject, setSubject] = useState('');
    const [topics, setTopics] = useState('');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e) => {
        e.preventDefault();
        console.log('Viva data:', { subject, topics, difficulty });
        
        // Basic validation
        if (!subject.trim() || !topics.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        if (topics.trim().length < 10) {
            toast.error('Topics description must be at least 10 characters');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login first');
                router.push('/auth');
                return;
            }

            // Make API call to backend to generate viva
            const response = await fetch('http://localhost:5001/api/viva/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: subject.trim(),
                    topics: topics.trim(),
                    difficulty: difficulty
                })
            });

            const data = await response.json();
            console.log('Response:', data);

            if (!response.ok) {
                console.error('Server error:', data);
                throw new Error(data.message || 'Failed to generate viva session');
            }

            if (data.success && data.mockId) {
                console.log("Viva generated:", data);
                
                // Create viva object for localStorage (for backward compatibility)
                const vivaData = {
                    mockId: data.mockId,
                    subject: subject.trim(),
                    topics: topics.trim(),
                    difficulty: difficulty,
                    jsonMockResp: JSON.stringify(data.questions),
                    createdAt: new Date().toISOString(),
                    createdBy: JSON.parse(localStorage.getItem('user'))?.email || 'user@example.com'
                };
                
                // Store individual viva data
                localStorage.setItem('viva_' + data.mockId, JSON.stringify(vivaData));
                
                // Update vivas list in localStorage
                const existingVivas = JSON.parse(localStorage.getItem('vivas') || '[]');
                existingVivas.push(vivaData);
                localStorage.setItem('vivas', JSON.stringify(existingVivas));
                
                toast.success('Viva session created successfully!');
                setOpenDialog(false);
                router.push('/classroom/vivaone/' + data.mockId);
            } else {
                console.log("ERROR: No mockId returned");
                throw new Error('No viva session ID returned from server');
            }
        } catch (error) {
            console.error('Error during viva generation:', error);
            toast.error(error.message || 'Network error. Please check if the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='p-10 border rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:scale-105 transition-all cursor-pointer text-center relative overflow-hidden group' 
                onClick={() => setOpenDialog(true)}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                <div className="text-lg font-bold relative z-10">+ Create New Viva</div>
                <div className="text-sm opacity-90 relative z-10">Academic Practice Session</div>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-2xl p-8 bg-white rounded-xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                            Create Viva Practice Session
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 mt-2">
                            Set up your academic viva practice with custom topics and difficulty level
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <div className='mt-4'>
                                <label className="font-medium text-gray-700">Subject/Course Name *</label>
                                <div className='mt-2'>
                                    <Input 
                                        className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        placeholder="Ex. Computer Networks, Data Structures, Mathematics" 
                                        required
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className='mt-4'>
                                <label className="font-medium text-gray-700">Topics to Cover *</label>
                                <div className='mt-2'>
                                    <Textarea 
                                        className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        placeholder="Ex. TCP/IP, OSI Model, Routing Protocols, Network Security, etc." 
                                        required
                                        rows={4}
                                        value={topics}
                                        onChange={(event) => setTopics(event.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div className='grid grid-cols-1 gap-4 mt-4'>
                                <div>
                                    <label className="font-medium text-gray-700">Difficulty Level</label>
                                    <div className='mt-2'>
                                        <select 
                                            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={difficulty}
                                            onChange={(event) => setDifficulty(event.target.value)}
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className='flex gap-4 justify-end mt-6'>
                            <Button type="button" variant="ghost" className="text-gray-600 hover:text-gray-800" onClick={() => setOpenDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition">
                                {loading ? <LoaderCircle className='animate-spin' /> : <BookOpen className="w-4 h-4" />}
                                {loading ? 'Generating Viva Questions...' : 'Create Viva Session'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AddNewInterview;
