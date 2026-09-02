const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/me — get current user info
router.get('/me', auth, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    selectedPractices: req.user.selectedPractices,
    practicesSelected: req.user.practicesSelected,
  });
});

// POST /api/user/practices — save selected practices
router.post('/practices', auth, async (req, res) => {
  try {
    const { practices } = req.body;

    if (!practices || !Array.isArray(practices) || practices.length === 0) {
      return res.status(400).json({ message: 'Please select at least one practice' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { selectedPractices: practices, practicesSelected: true },
      { new: true }
    );

    res.json({
      message: 'Practices saved successfully',
      selectedPractices: user.selectedPractices,
      practicesSelected: user.practicesSelected,
    });
  } catch (err) {
    console.error('Save practices error:', err);
    res.status(500).json({ message: 'Server error saving practices' });
  }
});

module.exports = router;
