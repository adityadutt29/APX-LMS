const express = require('express');
const router = express.Router();
const {
  getMindmaps,
  createMindmap,
  updateMindmap,
  deleteMindmap
} = require('../controllers/MindmapController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.route('/')
  .get(getMindmaps)
  .post(createMindmap);

router.route('/:id')
  .patch(updateMindmap)
  .delete(deleteMindmap);

module.exports = router;
