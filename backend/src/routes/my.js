const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { Home } = require('../models/Home');

const router = express.Router();

router.get('/homes', requireAuth, async (req, res) => {
  const email = req.user?.email?.toLowerCase();
  if (!email) return res.status(401).json({ message: 'Unauthorized' });
  const homes = await Home.find({
    $or: [
      { 'client.email': email },
      { 'builder.email': email },
      { 'monitors.email': email },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(100);
  res.json(homes);
});

module.exports = router;


