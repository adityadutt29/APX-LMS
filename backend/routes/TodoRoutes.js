const express = require('express');
const router = express.Router();
const {
  getTodos,
  createList,
  addTask,
  updateTask,
  deleteTask,
  reorderTasks,
  deleteList,
  updateList,
} = require('../controllers/TodoController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// @route   GET /api/todos
// @desc    Get teacher's todo lists
// @access  Teacher only
router.get('/', getTodos);

// @route   POST /api/todos/lists
// @desc    Create a new todo list
// @access  Teacher only
router.post('/lists', createList);

// @route   PUT /api/todos/lists/:listId
// @desc    Update list title
// @access  Teacher only
router.put('/lists/:listId', updateList);

// @route   DELETE /api/todos/lists/:listId
// @desc    Delete entire list
// @access  Teacher only
router.delete('/lists/:listId', deleteList);

// @route   POST /api/todos/lists/:listId/tasks
// @desc    Add task to a list
// @access  Teacher only
router.post('/lists/:listId/tasks', addTask);

// @route   PUT /api/todos/lists/:listId/tasks/:taskId
// @desc    Update task
// @access  Teacher only
router.put('/lists/:listId/tasks/:taskId', updateTask);

// @route   DELETE /api/todos/lists/:listId/tasks/:taskId
// @desc    Delete task
// @access  Teacher only
router.delete('/lists/:listId/tasks/:taskId', deleteTask);

// @route   PUT /api/todos/lists/:listId/reorder
// @desc    Reorder tasks within a list
// @access  Teacher only
router.put('/lists/:listId/reorder', reorderTasks);

module.exports = router;
