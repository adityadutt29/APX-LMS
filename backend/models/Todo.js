const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  done: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const TodoListSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  tasks: [TaskSchema],
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const TodoSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lists: [TodoListSchema],
}, {
  timestamps: true,
});

// Middleware to update updatedAt timestamp
TodoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update list timestamps
  this.lists.forEach(list => {
    if (list.isModified()) {
      list.updatedAt = Date.now();
    }
    
    // Update task timestamps
    list.tasks.forEach(task => {
      if (task.isModified()) {
        task.updatedAt = Date.now();
      }
    });
  });
  
  next();
});

module.exports = mongoose.model('Todo', TodoSchema);
