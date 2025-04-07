const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const createDirectories = async () => {
  const dirs = [
    path.join(__dirname, '../../uploads/profiles'),
    path.join(__dirname, '../../uploads/locked'),
    path.join(__dirname, '../../uploads/blurred')
  ];  
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

createDirectories();

// Process and save uploaded profile photo
const processProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const filename = `${uuidv4()}.webp`;
    const outputPath = path.join('uploads', 'profiles', filename);
    const fullOutputPath = path.join(__dirname, '../..', outputPath);
    
      await sharp(req.file.buffer)
      .webp({ quality: 100 })
      .toFile(fullOutputPath);
    
    req.processedImage = {
      path: outputPath,
      filename
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Process key picture and create blurred version
const processLockedPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const filename = `${uuidv4()}.webp`;
    const outputPath = path.join('uploads', 'locked', filename);
    const blurredPath = path.join('uploads', 'blurred', filename);
    const fullOutputPath = path.join(__dirname, '../..', outputPath);
    const fullBlurredPath = path.join(__dirname, '../..', blurredPath);
    
    // Save original image
    await sharp(req.file.buffer)
      .webp({ quality: 100 })
      .toFile(fullOutputPath);
    
    // Create and save blurred version
    await sharp(req.file.buffer)
      .blur(40) // Apply significant blur
      .modulate({ brightness: 0.8 }) // Slightly darken
      .webp({ quality: 60 })
      .toFile(fullBlurredPath);
    
    req.processedImage = {
      path: outputPath,
      blurredPath: blurredPath,
      filename
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { processProfilePhoto, processLockedPhoto };