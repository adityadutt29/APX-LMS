const Todo = require('../models/Todo');
const User = require('../models/Users');

// @desc    Get teacher's todo lists
// @route   GET /api/todos
// @access  Teacher only
const getTodos = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    let todo = await Todo.findOne({ teacher: teacherId });
    
    // If no todo document exists, create one with default content
    if (!todo) {
      todo = new Todo({
        teacher: teacherId,
        lists: [
          {
            title: "My First List",
            tasks: [
              { text: "Grade assignments for Section A", done: false, order: 0 },
              { text: "Prepare slides for next class", done: false, order: 1 },
            ],
            order: 0
          }
        ]
      });
      await todo.save();
    }

    res.json({
      success: true,
      data: todo.lists
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Server error while fetching todos' });
  }
};

// @desc    Create a new todo list
// @route   POST /api/todos/lists
// @access  Teacher only
const createList = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'List title is required' });
    }

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    let todo = await Todo.findOne({ teacher: teacherId });
    
    // If no todo document exists, create one
    if (!todo) {
      todo = new Todo({
        teacher: teacherId,
        lists: []
      });
    }

    const newList = {
      title: title.trim(),
      tasks: [],
      order: todo.lists.length
    };

    todo.lists.push(newList);
    await todo.save();

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: newList
    });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ message: 'Server error while creating list' });
  }
};

// @desc    Add task to a list
// @route   POST /api/todos/lists/:listId/tasks
// @access  Teacher only
const addTask = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { listId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Task text is required' });
    }

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const todo = await Todo.findOne({ teacher: teacherId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo document not found' });
    }

    const list = todo.lists.id(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const newTask = {
      text: text.trim(),
      done: false,
      order: list.tasks.length
    };

    list.tasks.push(newTask);
    await todo.save();

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: newTask
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ message: 'Server error while adding task' });
  }
};

// @desc    Update task
// @route   PUT /api/todos/lists/:listId/tasks/:taskId
// @access  Teacher only
const updateTask = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { listId, taskId } = req.params;
    const { text, done } = req.body;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const todo = await Todo.findOne({ teacher: teacherId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo document not found' });
    }

    const list = todo.lists.id(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const task = list.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task properties
    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({ message: 'Task text cannot be empty' });
      }
      task.text = text.trim();
    }
    if (done !== undefined) {
      task.done = Boolean(done);
    }

    await todo.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/todos/lists/:listId/tasks/:taskId
// @access  Teacher only
const deleteTask = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { listId, taskId } = req.params;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const todo = await Todo.findOne({ teacher: teacherId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo document not found' });
    }

    const list = todo.lists.id(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    const taskIndex = list.tasks.findIndex(task => task._id.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    list.tasks.splice(taskIndex, 1);
    await todo.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

// @desc    Reorder tasks within a list
// @route   PUT /api/todos/lists/:listId/reorder
// @access  Teacher only
const reorderTasks = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { listId } = req.params;
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks must be an array' });
    }

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const todo = await Todo.findOne({ teacher: teacherId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo document not found' });
    }

    const list = todo.lists.id(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Update task order
    tasks.forEach((taskUpdate, index) => {
      const task = list.tasks.id(taskUpdate.id);
      if (task) {
        task.order = index;
      }
    });

    // Sort tasks by order
    list.tasks.sort((a, b) => a.order - b.order);

    await todo.save();

    res.json({
      success: true,
      message: 'Tasks reordered successfully',
      data: list.tasks
    });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ message: 'Server error while reordering tasks' });
  }
};

// @desc    Delete entire list
// @route   DELETE /api/todos/lists/:listId
// @access  Teacher only
const deleteList = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { listId } = req.params;

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const todo = await Todo.findOne({ teacher: teacherId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo document not found' });
    }

    const listIndex = todo.lists.findIndex(list => list._id.toString() === listId);
    if (listIndex === -1) {
      return res.status(404).json({ message: 'List not found' });
    }

    todo.lists.splice(listIndex, 1);
    await todo.save();

    res.json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ message: 'Server error while deleting list' });
  }
};

// @desc    Update list title
// @route   PUT /api/todos/lists/:listId
// @access  Teacher only
const updateList = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { listId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'List title is required' });
    }

    // Verify user is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teacher role required.' });
    }

    const todo = await Todo.findOne({ teacher: teacherId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo document not found' });
    }

    const list = todo.lists.id(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    list.title = title.trim();
    await todo.save();

    res.json({
      success: true,
      message: 'List updated successfully',
      data: list
    });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ message: 'Server error while updating list' });
  }
};

module.exports = {
  getTodos,
  createList,
  addTask,
  updateTask,
  deleteTask,
  reorderTasks,
  deleteList,
  updateList,
};
