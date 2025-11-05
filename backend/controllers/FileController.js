const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// @desc    Upload files to MongoDB GridFS, return link
// @route   POST /api/files/upload
// @access  Private
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const db = mongoose.connection.client.db(mongoose.connection.db.databaseName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const fileDocs = await Promise.all(req.files.map(async (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            size: file.size
          }
        });

        uploadStream.end(file.buffer, (err) => {
          if (err) return reject(err);
          resolve({
            id: uploadStream.id.toString(),
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/api/files/gridfs/${uploadStream.id}`
          });
        });
      });
    }));

    res.json({
      success: true,
      message: 'Files uploaded to MongoDB GridFS',
      data: fileDocs
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get file from GridFS for preview
// @route   GET /api/files/gridfs/:id
// @access  Private
const getGridFSFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const db = mongoose.connection.client.db(mongoose.connection.db.databaseName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid file id' });
    }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileDoc = files[0];
    res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${fileDoc.filename}"`);

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', (err) => {
      console.error('GridFS stream error:', err);
      if (!res.headersSent) {
        res.status(404).json({ message: 'File not found' });
      }
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Get GridFS file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// @desc    Download file from GridFS
// @route   GET /api/files/gridfs/:id/download
// @access  Private
const downloadGridFSFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const db = mongoose.connection.client.db(mongoose.connection.db.databaseName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid file id' });
    }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileDoc = files[0];
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', (err) => {
      console.error('GridFS download error:', err);
      if (!res.headersSent) {
        res.status(404).json({ message: 'File not found' });
      }
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Download GridFS file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// @desc    Delete file from GridFS
// @route   DELETE /api/files/gridfs/:id
// @access  Private
const deleteGridFSFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const db = mongoose.connection.client.db(mongoose.connection.db.databaseName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(fileId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid file id' });
    }

    await bucket.delete(objectId);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete GridFS file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadFiles,
  getGridFSFile,
  downloadGridFSFile,
  deleteGridFSFile
};
