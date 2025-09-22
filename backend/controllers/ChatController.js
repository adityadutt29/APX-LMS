const ChatRoom = require('../models/Chat');
const User = require('../models/Users');
const { createNotification } = require('./NotificationController');

// Get all chat rooms for a user
exports.getChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const chatRooms = await ChatRoom.find({
      'participants.user': userId,
      isActive: true
    })
    .populate('participants.user', 'name email role avatar')
    .populate('createdBy', 'name email role')
    .populate('messages.sender', 'name email role avatar')
    .sort({ updatedAt: -1 });

    // Add unread count for each room
    const roomsWithUnread = chatRooms.map(room => {
      const roomObj = room.toObject();
      roomObj.unreadCount = room.messages.filter(msg => 
        !msg.readBy.some(read => read.user.toString() === userId.toString())
      ).length;
      
      // Get last message
      roomObj.lastMessage = room.messages.length > 0 ? 
        room.messages[room.messages.length - 1] : null;
      
      return roomObj;
    });

    res.json({
      success: true,
      data: roomsWithUnread
    });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new chat room
exports.createChatRoom = async (req, res) => {
  try {
    const { name, description, type, participants, isPrivate } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only admins and teachers can create chat rooms
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers and admins only.' });
    }

    // For direct chats, generate a name
    let roomName = name;
    if (type === 'direct' && participants.length === 1) {
      const otherUser = await User.findById(participants[0]).select('name');
      const currentUser = await User.findById(userId).select('name');
      roomName = `${currentUser.name} & ${otherUser.name}`;
    }

    // Create chat room
    const chatRoom = new ChatRoom({
      name: roomName,
      description,
      type: type || 'group',
      createdBy: userId,
      settings: {
        isPrivate: isPrivate || false,
        allowFileSharing: true,
        maxParticipants: 50
      }
    });

    // Add creator as admin
    chatRoom.participants.push({
      user: userId,
      role: 'admin',
      joinedAt: new Date()
    });

    // Add other participants
    if (participants && participants.length > 0) {
      for (const participantId of participants) {
        if (participantId !== userId) {
          chatRoom.participants.push({
            user: participantId,
            role: 'member',
            joinedAt: new Date()
          });
        }
      }
    }

    await chatRoom.save();
    
    // Populate the response
    await chatRoom.populate('participants.user', 'name email role avatar');
    await chatRoom.populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      data: chatRoom,
      message: 'Chat room created successfully'
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get chat room details
exports.getChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': userId
    })
    .populate('participants.user', 'name email role avatar')
    .populate('createdBy', 'name email role')
    .populate('messages.sender', 'name email role avatar');

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found or access denied' });
    }

    // Mark user as seen
    const participant = chatRoom.participants.find(p => 
      p.user._id.toString() === userId.toString()
    );
    if (participant) {
      participant.lastSeen = new Date();
      await chatRoom.save();
    }

    res.json({
      success: true,
      data: chatRoom
    });
  } catch (error) {
    console.error('Error fetching chat room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, messageType, fileUrl, fileName } = req.body;
    const userId = req.user.id;

    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': userId
    });

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found or access denied' });
    }

    const messageData = {
      sender: userId,
      content,
      messageType: messageType || 'text',
      fileUrl,
      fileName
    };

    chatRoom.messages.push(messageData);
    await chatRoom.save();

    // Populate the new message
    await chatRoom.populate('messages.sender', 'name email role avatar');
    const newMessage = chatRoom.messages[chatRoom.messages.length - 1];

    // Emit to WebSocket for real-time updates and create notifications
    if (global.notificationWS) {
      chatRoom.participants.forEach(async (participant) => {
        if (participant.user.toString() !== userId.toString()) {
          // Send WebSocket notification
          global.notificationWS.sendToUser(participant.user.toString(), {
            type: 'new_message',
            data: {
              roomId: chatRoom._id,
              message: newMessage,
              roomName: chatRoom.name
            }
          });

          // Create database notification
          try {
            await createNotification({
              recipient: participant.user,
              sender: userId,
              type: 'chat',
              title: `New message in ${chatRoom.name}`,
              message: `${newMessage.sender.name}: ${content}`,
              metadata: {
                chatRoomId: chatRoom._id,
                chatRoomName: chatRoom.name,
                messageId: newMessage._id
              }
            });
          } catch (notificationError) {
            console.error('Error creating chat notification:', notificationError);
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add participant to chat room (Admin only)
exports.addParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId: newUserId, role } = req.body;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if current user is admin or room admin
    const currentParticipant = chatRoom.participants.find(p => 
      p.user.toString() === currentUserId.toString()
    );

    if (currentUserRole !== 'admin' && 
        (!currentParticipant || currentParticipant.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Check if user is already a participant
    const existingParticipant = chatRoom.participants.find(p => 
      p.user.toString() === newUserId.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({ message: 'User is already a participant' });
    }

    // Add new participant
    await chatRoom.addParticipant(newUserId, role || 'member');
    
    // Populate and return updated room
    await chatRoom.populate('participants.user', 'name email role avatar');

    // Send notification to new participant
    if (global.notificationWS) {
      global.notificationWS.sendToUser(newUserId, {
        type: 'added_to_chat',
        data: {
          roomId: chatRoom._id,
          roomName: chatRoom.name,
          addedBy: req.user.name
        }
      });
    }

    res.json({
      success: true,
      data: chatRoom,
      message: 'Participant added successfully'
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove participant from chat room (Admin only)
exports.removeParticipant = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if current user is admin or room admin
    const currentParticipant = chatRoom.participants.find(p => 
      p.user.toString() === currentUserId.toString()
    );

    if (currentUserRole !== 'admin' && 
        (!currentParticipant || currentParticipant.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Cannot remove the room creator unless it's a system admin
    if (chatRoom.createdBy.toString() === userId && currentUserRole !== 'admin') {
      return res.status(403).json({ message: 'Cannot remove room creator' });
    }

    await chatRoom.removeParticipant(userId);
    await chatRoom.populate('participants.user', 'name email role avatar');

    res.json({
      success: true,
      data: chatRoom,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user.id;

    const chatRoom = await ChatRoom.findOne({
      _id: roomId,
      'participants.user': userId
    });

    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found or access denied' });
    }

    await chatRoom.markAsRead(userId, messageIds);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available users for chat (teachers and admins)
exports.getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Only admins and teachers can access this
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { _id: { $ne: currentUserId }, isActive: true };
    
    // Teachers can only see other teachers and admins
    if (userRole === 'teacher') {
      query.role = { $in: ['teacher', 'admin'] };
    } else {
      // Admins can see teachers and other admins
      query.role = { $in: ['teacher', 'admin'] };
    }

    const users = await User.find(query)
      .select('name email role department employeeId avatar')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete chat room (Admin only)
exports.deleteChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Only system admin or room creator can delete
    if (userRole !== 'admin' && chatRoom.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    chatRoom.isActive = false;
    await chatRoom.save();

    res.json({
      success: true,
      message: 'Chat room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat room:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
