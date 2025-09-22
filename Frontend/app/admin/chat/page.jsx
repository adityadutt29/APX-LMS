'use client';

import ChatRoom from '../../components/ChatRoom';

export default function AdminChatPage() {
  return (
    <div className="h-screen w-full">
      <ChatRoom role="admin" />
    </div>
  );
}
