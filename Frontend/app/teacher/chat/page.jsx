'use client';

import ChatRoom from '../../components/ChatRoom';
import { MessageCircle, Users, Bell } from 'lucide-react';

export default function TeacherChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-sm">
          <ChatRoom role="teacher" />
        </div>
      </div>
    </div>
  );
}
