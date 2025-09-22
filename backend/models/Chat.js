const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ChatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'public'],
    default: 'group'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [MessageSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 50
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for better performance
ChatRoomSchema.index({ 'participants.user': 1 });
ChatRoomSchema.index({ createdAt: -1 });
ChatRoomSchema.index({ type: 1, isActive: 1 });

// Virtual for unread message count
ChatRoomSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => 
    !msg.readBy.some(read => read.user.toString() === this.currentUserId)
  ).length;
});

// Method to add participant
ChatRoomSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
  return this.save();
};

// Method to remove participant
ChatRoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => 
    p.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add message
ChatRoomSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  return this.save();
};

// Method to mark messages as read
ChatRoomSchema.methods.markAsRead = function(userId, messageIds = []) {
  if (messageIds.length === 0) {
    // Mark all messages as read
    this.messages.forEach(msg => {
      if (!msg.readBy.some(read => read.user.toString() === userId.toString())) {
        msg.readBy.push({ user: userId, readAt: new Date() });
      }
    });
  } else {
    // Mark specific messages as read
    messageIds.forEach(msgId => {
      const message = this.messages.id(msgId);
      if (message && !message.readBy.some(read => read.user.toString() === userId.toString())) {
        message.readBy.push({ user: userId, readAt: new Date() });
      }
    });
  }
  return this.save();
};

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
