const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout (client discards token; endpoint provided for completeness/blacklisting hook)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, login, getMe, logout };
