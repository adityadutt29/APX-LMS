const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  getStudentsByTeacher, 
  getGradesByTeacher,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/UserController');
const validateLogin = require('../middleware/validateLogin');
const validateRegister = require('../middleware/validateRegister');
const auth = require('../middleware/auth');
const protect = require('../middleware/auth');
const User = require('../models/Users');

// Authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.get('/students', getStudentsByTeacher);
router.get('/grades', getGradesByTeacher);

// Admin routes (require authentication and admin role)
router.get('/admin/users', auth, getAllUsers);
router.post('/admin/users', auth, createUser);
router.put('/admin/users/:id', auth, updateUser);
router.delete('/admin/users/:id', auth, deleteUser);

// Remove duplicate getAllUsers and merge role filtering into one route
router.get('/', protect, async (req, res) => {
  try {
    const { role } = req.query;
    // If role=student, allow teacher or admin; otherwise, allow user to fetch their own info
    if (role === 'student') {
      if (!['teacher', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: Only teachers or admins can view students.' });
      }
      const users = await User.find({ role: 'student' }).select('-password');
      return res.json(users);
    }
    // If no role filter, allow any authenticated user to fetch all users (or restrict to admin if needed)
    // If you want only admin to fetch all users, uncomment below:
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Forbidden: Only admin can view all users.' });
    // }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
