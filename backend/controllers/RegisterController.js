const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  const { name, email, password, role, section, department, studentId, employeeId, teachingSections } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check for unique student/employee ID
    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    if ((role === 'teacher' || role === 'admin') && employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee ID already exists' });
      }
    }

    // Create user object
    const userData = {
      name: name || email.split('@')[0], // Use email prefix if name not provided
      email,
      password,
      role: role || 'student',
      department: department || 'General'
    };

    // Add role-specific fields
    if (role === 'student') {
      userData.section = section || 'SEM VII';
      userData.studentId = studentId || 'STU' + Date.now().toString().slice(-6);
    } else if (role === 'teacher') {
      userData.employeeId = employeeId || 'EMP' + Date.now().toString().slice(-6);
      userData.teachingSections = teachingSections || [];
    } else if (role === 'admin') {
      userData.employeeId = employeeId || 'ADM' + Date.now().toString().slice(-6);
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        email: user.email,
        name: user.name 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        section: user.section,
        studentId: user.studentId,
        employeeId: user.employeeId
      },
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
