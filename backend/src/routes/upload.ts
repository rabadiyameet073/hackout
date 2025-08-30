import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { asyncHandler, validationError } from '@/middleware/errorHandler';
import { logger, loggerHelpers } from '@/utils/logger';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
router.post('/image', authenticate, upload.single('image'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    throw validationError('No image file provided');
  }

  const userId = req.user!.id;
  const { purpose = 'incident' } = req.body; // incident, profile, evidence

  try {
    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${purpose}/${userId}/${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: filename,
          folder: 'mangrove-watch',
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          tags: [purpose, userId]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(processedImage);
    });

    const result = uploadResult as any;

    // Generate thumbnail
    const thumbnailResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: `${filename}_thumb`,
          folder: 'mangrove-watch/thumbnails',
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto:low' }
          ],
          tags: [purpose, userId, 'thumbnail']
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(processedImage);
    });

    const thumbResult = thumbnailResult as any;

    const imageData = {
      url: result.secure_url,
      thumbnail_url: thumbResult.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      uploaded_by: userId,
      purpose,
      created_at: new Date().toISOString()
    };

    loggerHelpers.logUserAction(userId, 'image_uploaded', { 
      purpose, 
      filename: req.file.originalname,
      size: req.file.size 
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { image: imageData }
    });

  } catch (error: any) {
    logger.error('Image upload failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}));

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
router.post('/images', authenticate, upload.array('images', 5), asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw validationError('No image files provided');
  }

  const userId = req.user!.id;
  const { purpose = 'incident' } = req.body;
  const uploadedImages = [];

  try {
    for (const file of req.files) {
      // Process image with Sharp
      const processedImage = await sharp(file.buffer)
        .resize(1920, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer();

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `${purpose}/${userId}/${timestamp}_${randomSuffix}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: filename,
            folder: 'mangrove-watch',
            transformation: [
              { width: 1920, height: 1080, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            tags: [purpose, userId]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(processedImage);
      });

      const result = uploadResult as any;

      // Generate thumbnail
      const thumbnailResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            public_id: `${filename}_thumb`,
            folder: 'mangrove-watch/thumbnails',
            transformation: [
              { width: 300, height: 300, crop: 'fill' },
              { quality: 'auto:low' }
            ],
            tags: [purpose, userId, 'thumbnail']
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(processedImage);
      });

      const thumbResult = thumbnailResult as any;

      uploadedImages.push({
        url: result.secure_url,
        thumbnail_url: thumbResult.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        uploaded_by: userId,
        purpose,
        original_name: file.originalname,
        created_at: new Date().toISOString()
      });
    }

    loggerHelpers.logUserAction(userId, 'multiple_images_uploaded', { 
      purpose, 
      count: uploadedImages.length,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0)
    });

    res.status(201).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: { images: uploadedImages }
    });

  } catch (error: any) {
    logger.error('Multiple image upload failed:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
}));

// @desc    Delete image
// @route   DELETE /api/upload/image/:publicId
// @access  Private
router.delete('/image/:publicId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { publicId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user owns this image or is admin
    const decodedPublicId = decodeURIComponent(publicId);
    
    // Check if user uploaded this image (public_id contains user ID)
    if (!decodedPublicId.includes(userId) && req.user!.role !== 'admin') {
      throw new Error('Not authorized to delete this image');
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(decodedPublicId);
    
    // Also delete thumbnail if exists
    try {
      await cloudinary.uploader.destroy(`${decodedPublicId}_thumb`);
    } catch (thumbError) {
      // Thumbnail deletion failure is not critical
      logger.warn('Failed to delete thumbnail:', thumbError);
    }

    if (result.result !== 'ok') {
      throw new Error('Failed to delete image from storage');
    }

    loggerHelpers.logUserAction(userId, 'image_deleted', { publicId: decodedPublicId });

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    logger.error('Image deletion failed:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
}));

// @desc    Get image metadata
// @route   GET /api/upload/image/:publicId/info
// @access  Private
router.get('/image/:publicId/info', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { publicId } = req.params;

  try {
    const decodedPublicId = decodeURIComponent(publicId);
    const result = await cloudinary.api.resource(decodedPublicId);

    const imageInfo = {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      created_at: result.created_at,
      tags: result.tags || []
    };

    res.json({
      success: true,
      data: { image: imageInfo }
    });

  } catch (error: any) {
    logger.error('Failed to get image info:', error);
    throw new Error(`Failed to get image information: ${error.message}`);
  }
}));

// Error handling middleware for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File too large. Maximum size allowed is 10MB.'
        }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Too many files. Maximum 5 files allowed.'
        }
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }

  next(error);
});

export default router;
