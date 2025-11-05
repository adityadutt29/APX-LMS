const express = require('express');
const multer = require('multer');
const { uploadFiles, getGridFSFile, downloadGridFSFile, deleteGridFSFile } = require('../controllers/FileController');
const auth = require('../middleware/auth');

const router = express.Router();

// Use memory storage for GridFS
const upload = multer({ storage: multer.memoryStorage() });

// Upload files to GridFS
router.post('/upload', auth, upload.array('files', 10), uploadFiles);

// Get file from GridFS (preview)
router.get('/gridfs/:id', auth, getGridFSFile);

// Download file from GridFS
router.get('/gridfs/:id/download', auth, downloadGridFSFile);

// Delete file from GridFS
router.delete('/gridfs/:id', auth, deleteGridFSFile);

module.exports = router;
