import { useState, useEffect, useRef } from 'react';
import { Send, Plus, Users, Search, MoreVertical, Paperclip, Smile } from 'lucide-react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api';

const ChatRoom = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Get current user info
  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  };

  const currentUser = getCurrentUser();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // WebSocket connection for real-time updates
  wsRef.current = new WebSocket(`ws://localhost:5001/ws?token=${token}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        // If the message is for the active room, add it to messages
        if (activeRoom && data.data.roomId === activeRoom._id) {
          setMessages(prev => [...prev, data.data.message]);
        }
        
        // Update the chat room list to show new message
        fetchChatRooms();
      } else if (data.type === 'added_to_chat') {
        fetchChatRooms();
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeRoom]);

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }

      const data = await response.json();
      setChatRooms(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available users
  const fetchAvailableUsers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chat/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setAvailableUsers(data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Select chat room
  const selectChatRoom = async (room) => {
    setActiveRoom(room);
    setMessages(room.messages || []);
    
    // Mark messages as read
    if (room.unreadCount > 0) {
      await markAsRead(room._id);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeRoom) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chat/${activeRoom._id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.data]);
      setNewMessage('');
      
      // Update chat rooms list
      fetchChatRooms();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Create new chat room
  const createChatRoom = async (formData) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat room');
      }

      const data = await response.json();
      fetchChatRooms();
      setShowNewChatModal(false);
      setActiveRoom(data.data);
      setMessages([]);
    } catch (err) {
      console.error('Error creating chat room:', err);
    }
  };

  // Add participant to chat room
  const addParticipant = async (userId) => {
    if (!activeRoom) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/chat/${activeRoom._id}/participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: 'member' }),
      });

      if (!response.ok) {
        throw new Error('Failed to add participant');
      }

      fetchChatRooms();
      setShowAddParticipantModal(false);
    } catch (err) {
      console.error('Error adding participant:', err);
    }
  };

  // Mark messages as read
  const markAsRead = async (roomId) => {
    try {
      const token = getAuthToken();
      await fetch(`${API_BASE_URL}/chat/${roomId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  useEffect(() => {
    fetchChatRooms();
    fetchAvailableUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="bg-white h-screen w-full flex">
      {/* Chat Rooms Sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Chats</h2>
            <button
              onClick={() => {
                setShowNewChatModal(true);
                fetchAvailableUsers();
              }}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chatRooms
            .filter(room => 
              room.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(room => (
              <div
                key={room._id}
                onClick={() => selectChatRoom(room)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  activeRoom?._id === room._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{room.name}</h3>
                    {room.lastMessage && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {room.lastMessage.sender.name}: {room.lastMessage.content}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {room.participants.length} participants
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {room.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {new Date(room.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                    {room.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 mt-1">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{activeRoom.name}</h2>
                <p className="text-sm text-gray-600">
                  {activeRoom.participants.length} participants
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowAddParticipantModal(true);
                      fetchAvailableUsers();
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Add Participant"
                  >
                    <Users size={18} />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender._id === currentUser?.id;
                return (
                  <div
                    key={message._id || index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender.name}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Smile size={18} />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
              <p className="text-sm">Choose from existing chats or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && <NewChatModal />}

      {/* Add Participant Modal */}
      {showAddParticipantModal && <AddParticipantModal />}
    </div>
  );

  // New Chat Modal Component
  function NewChatModal() {
    const [chatType, setChatType] = useState('direct');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [chatName, setChatName] = useState('');
    const [chatDescription, setChatDescription] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const formData = {
        name: chatType === 'direct' ? '' : chatName,
        description: chatDescription,
        type: chatType,
        participants: selectedUsers,
        isPrivate: false
      };

      createChatRoom(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New Chat</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chat Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Chat Type</label>
              <select
                value={chatType}
                onChange={(e) => setChatType(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="direct">Direct Message</option>
                <option value="group">Group Chat</option>
              </select>
            </div>

            {/* Chat Name (for group chats) */}
            {chatType === 'group' && (
              <div>
                <label className="block text-sm font-medium mb-2">Chat Name</label>
                <input
                  type="text"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Enter chat name"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={chatDescription}
                onChange={(e) => setChatDescription(e.target.value)}
                placeholder="Enter chat description"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            {/* Select Users */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select {chatType === 'direct' ? 'User' : 'Users'}
              </label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {availableUsers.map(user => (
                  <label key={user._id} className="flex items-center p-2 hover:bg-gray-50">
                    <input
                      type={chatType === 'direct' ? 'radio' : 'checkbox'}
                      name="selectedUsers"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (chatType === 'direct') {
                          setSelectedUsers(e.target.checked ? [user._id] : []);
                        } else {
                          setSelectedUsers(prev =>
                            e.target.checked
                              ? [...prev, user._id]
                              : prev.filter(id => id !== user._id)
                          );
                        }
                      }}
                      className="mr-2"
                    />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Chat
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Add Participant Modal Component
  function AddParticipantModal() {
    const [selectedUser, setSelectedUser] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (selectedUser) {
        addParticipant(selectedUser);
      }
    };

    // Filter out users already in the chat
    const availableUsersForRoom = availableUsers.filter(user => 
      !activeRoom.participants.some(p => p.user._id === user._id)
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add Participant</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select User</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a user...</option>
                {availableUsersForRoom.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowAddParticipantModal(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add Participant
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

export default ChatRoom;
