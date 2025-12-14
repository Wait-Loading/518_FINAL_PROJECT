const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // backend/uploads
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
});

router.post(
  '/listing-images',
  auth,
  upload.array('images', 6),
  (req, res) => {
    const images = req.files.map((f) => ({

           url: `/api/uploads/${f.filename}`,
      filename: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    }));

    res.json({ images });
  }
);

module.exports = router;
