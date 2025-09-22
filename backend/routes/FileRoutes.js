const express = require('express');
const { upload } = require('../middleware/fileUpload');
const { uploadFiles, getFile, downloadFile } = require('../controllers/FileController');
const auth = require('../middleware/auth');

const router = express.Router();

// File upload route
router.post('/upload', auth, upload.array('files', 10), uploadFiles);

// File viewing route
router.get('/:filename', auth, getFile);

// File download route
router.get('/:filename/download', auth, downloadFile);

module.exports = router;
