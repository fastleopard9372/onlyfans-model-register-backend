import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3-transform';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Create multer storage configuration with image processing
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET,
  acl: 'private',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `photos/${fileName}`;
    cb(null, filePath);
  },
  shouldTransform: (req, file, cb) => {
    cb(null, true);
  },
  transforms: [
    {
      id: 'original',
      key: (req, file, cb) => {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `photos/original/${fileName}`;
        cb(null, filePath);
      },
      transform: (req, file, cb) => {
        cb(null, sharp().jpeg({ quality: 90 }));
      }
    },
    {
      id: 'blurred',
      key: (req, file, cb) => {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `photos/blurred/${fileName}`;
        cb(null, filePath);
      },
      transform: (req, file, cb) => {
        cb(null, sharp().blur(15).jpeg({ quality: 70 }));
      }
    }
  ]
});

// Configure multer upload
const upload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper function to generate signed URLs for S3 objects
const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expiresIn
  };
  
  return s3.getSignedUrl('getObject', params);
};

// Helper function to delete objects from S3
const deleteS3Object = async (key) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  };
  
  return s3.deleteObject(params).promise();
};

export { upload, getSignedUrl, deleteS3Object };
