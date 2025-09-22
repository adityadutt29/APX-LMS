"use client"
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react'
import InterviewItemCard from './InterviewItemCard';

function InterviewList() {
    const user = {primaryEmailAddress: {emailAddress: "test@example.com"}};
    const [vivaList,setVivaList]=useState([]);
    
    useEffect(()=>{
        GetVivaList();
    },[])

    const GetVivaList=async()=>{
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found');
                return;
            }

            // Try to fetch from backend first
            const response = await fetch('http://localhost:5001/api/viva/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Convert backend format to frontend format
                    const formattedVivas = data.vivas.map(viva => ({
                        ...viva,
                        createdAt: new Date(viva.createdAt).toLocaleDateString()
                    }));
                    setVivaList(formattedVivas);
                    console.log('Vivas fetched from backend:', formattedVivas);
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to fetch from backend, falling back to localStorage:', error);
        }

        // Fallback to localStorage
        const vivas = JSON.parse(localStorage.getItem('vivas') || '[]');
        const userEmail = JSON.parse(localStorage.getItem('user'))?.email || 'user@example.com';
        
        // Filter by current user
        const userVivas = vivas.filter(viva => 
            viva.createdBy === userEmail
        );

        console.log('Vivas from localStorage:', userVivas);
        setVivaList(userVivas);
    }

    const handleDelete = async (vivaId) => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Try to delete from backend first
                const response = await fetch(`http://localhost:5001/api/viva/${vivaId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('Viva deleted from backend');
                    }
                }
            }

            // Also remove from localStorage for backward compatibility
            const vivas = JSON.parse(localStorage.getItem('vivas') || '[]');
            const updatedVivas = vivas.filter(viva => viva.mockId !== vivaId);
            localStorage.setItem('vivas', JSON.stringify(updatedVivas));
            
            // Also remove the individual viva
            localStorage.removeItem('viva_' + vivaId);
            
            setVivaList(prevList => prevList.filter(viva => viva.mockId !== vivaId));
            toast.success("Viva session deleted successfully");
        } catch (error) {
            console.error("Error deleting viva:", error);
            toast.error("Failed to delete viva session");
        }
    };

  return (
    <div>
      <h2 className='font-medium text-2xl'><strong>Previous Viva Practice Sessions</strong></h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-3'>
        {vivaList&&vivaList.map((viva,index)=>(
            <InterviewItemCard 
            interview={viva}
            key={index}
            onDelete={handleDelete}
            />
        ))}
      </div>
    </div>
  )
}

export default InterviewList
