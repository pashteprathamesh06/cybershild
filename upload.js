const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `screenshot-${unique}${ext}`);
  },
});

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only PNG, JPG, JPEG, and WEBP image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB
  },
});

module.exports = upload;
