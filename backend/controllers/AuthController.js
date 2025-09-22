const User = require('../models/Users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email only (no role required)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

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

    // Return user info based on role
    let userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      section: user.section,
      isActive: user.isActive
    };

    // Add role-specific information
    if (user.role === 'student') {
      userInfo.section = user.section;
      userInfo.studentId = user.studentId;
    } else if (user.role === 'teacher') {
      userInfo.teachingSections = user.teachingSections;
      userInfo.employeeId = user.employeeId;
    } else if (user.role === 'admin') {
      userInfo.employeeId = user.employeeId;
    }

    res.json({ 
      success: true,
      token, 
      user: userInfo,
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register new user
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
      name,
      email,
      password,
      role,
      department
    };

    // Add role-specific fields
    if (role === 'student') {
      userData.section = section;
      userData.studentId = studentId;
    } else if (role === 'teacher') {
      userData.employeeId = employeeId;
      userData.teachingSections = teachingSections || [];
    } else if (role === 'admin') {
      userData.employeeId = employeeId;
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
        role: user.role
      },
      message: 'User registered successfully'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter to only include specified fields
    const filteredUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      section: user.section,
      studentId: user.studentId,
      teachingSections: user.teachingSections,
      department: user.department,
      employeeId: user.employeeId,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      data: filteredUser
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      department, 
      teachingSections
    } = req.body;
    
    const updateData = {};
    
    // Only allow updating specified fields
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (teachingSections) updateData.teachingSections = teachingSections;

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return filtered response
    const filteredUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      section: user.section,
      studentId: user.studentId,
      teachingSections: user.teachingSections,
      department: user.department,
      employeeId: user.employeeId,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      data: filteredUser,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Google OAuth login
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name,
        email,
        role: 'student', // Default role for Google OAuth users
        isActive: true,
        avatar: picture,
        password: await bcrypt.hash(Math.random().toString(36), 10) // Random password
      });
      await user.save();
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        email: user.email,
        name: user.name 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user info
    const userInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      section: user.section,
      isActive: user.isActive,
      avatar: user.avatar
    };

    res.json({ 
      success: true,
      token: jwtToken, 
      user: userInfo,
      message: `Welcome, ${user.name}!`
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ message: 'Invalid Google token' });
  }
};

// Google OAuth redirect handler
exports.googleCallback = async (req, res) => {
  try {
    // This would be implemented if using server-side OAuth flow
    // For now, we'll use client-side flow with token verification
    res.redirect('/auth?success=true');
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/auth?error=oauth_error');
  }
};
