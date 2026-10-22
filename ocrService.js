const Tesseract = require('tesseract.js');
const fs = require('fs');

/**
 * Extracts text from an image file using Tesseract.js OCR.
 * @param {string} filePath - Absolute path to the uploaded image.
 * @returns {Promise<string>} extracted text
 */
async function extractTextFromImage(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Uploaded image file not found on server');
  }

  const {
    data: { text },
  } = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {}, // silence progress logs in production
  });

  return (text || '').trim();
}

module.exports = { extractTextFromImage };
