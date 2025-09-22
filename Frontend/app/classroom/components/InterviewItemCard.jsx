import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React from 'react';
import { BookOpen, Calendar, ArrowRight, LineChart, Trash2, GraduationCap } from 'lucide-react';

function InterviewItemCard({interview, onDelete}) {
  const router = useRouter();

  const onStart = () => {
    router.push('/classroom/vivaone/' + interview?.mockId)
  }

  const onFeedbackPress = () => {
    router.push('/classroom/vivaone/' + interview?.mockId + "/feedback")
  }

  const handleDelete = () => {
    onDelete(interview.mockId);
  };

  return (
    <div className='group bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl p-6 relative overflow-hidden'>
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-all duration-300 group-hover:bg-blue-100" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-50 rounded-tr-full -ml-6 -mb-6 transition-all duration-300 group-hover:bg-blue-100" />

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Ready
        </span>
      </div>

      <div className='space-y-4 relative'>
        {/* Header */}
        <div>
          <h2 className='font-bold text-blue-600 text-xl mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors'>
            {interview?.subject || interview?.jobPosition}
          </h2>
        </div>

        {/* Details */}
        <div className='space-y-3'>
          <div className='flex items-center text-gray-600 bg-gray-50 rounded-lg p-2 transition-colors group-hover:bg-gray-100'>
            <GraduationCap className='w-4 h-4 mr-2 text-blue-600' />
            <h2 className='text-sm font-medium'>
              {interview?.difficulty || 'Intermediate'} Level
            </h2>
          </div>
          
          <div className='flex items-center text-gray-600 bg-gray-50 rounded-lg p-2 transition-colors group-hover:bg-gray-100'>
            <BookOpen className='w-4 h-4 mr-2 text-blue-600' />
            <h2 className='text-sm font-medium'>
              {interview?.topic || interview?.jobDesc || 'Academic Viva'}
            </h2>
          </div>
          
          <div className='flex items-center text-gray-500 bg-gray-50 rounded-lg p-2 transition-colors group-hover:bg-gray-100'>
            <Calendar className='w-4 h-4 mr-2 text-blue-600' />
            <h2 className='text-sm'>
              Created: {interview?.createdAt}
            </h2>
          </div>
        </div>

        {/* Buttons */}
        <div className='flex justify-between gap-5 pt-3'>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            onClick={onFeedbackPress}
          >
            <LineChart className="w-4 h-4" />
            Results
          </Button>
          <Button 
            size="sm" 
            className="w-full flex items-center justify-center gap-2 group/btn bg-blue-600 hover:bg-blue-700"
            onClick={onStart}
          >
            Start Viva
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-0 right-0 w-auto h-auto p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default InterviewItemCard;