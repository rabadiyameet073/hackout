import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import { authenticateToken } from '@/middleware/auth';
import { logger } from '@/utils/logger';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rate limiting for AI validation (expensive operations)
const aiValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 AI validations per windowMs
  message: 'Too many AI validation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/validation/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  incidentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  analysis: {
    environmentalDamage: {
      detected: boolean;
      description: string;
      extent: string;
    };
    mangroveFeatures: {
      treesVisible: boolean;
      rootSystemDamage: boolean;
      waterBodyPresent: boolean;
      biodiversityIndicators: string[];
    };
    humanActivity: {
      evidenceFound: boolean;
      activityType: string[];
      equipment: string[];
    };
    urgencyFactors: {
      immediateAction: boolean;
      spreadingRisk: boolean;
      criticalHabitat: boolean;
    };
  };
  recommendations: string[];
  flaggedConcerns: string[];
  geoContext: {
    locationRelevance: boolean;
    knownThreats: string[];
    protectedArea: boolean;
  };
}

interface ImageAnalysis {
  description: string;
  detectedObjects: string[];
  environmentalFeatures: string[];
  damageAssessment: {
    severity: number;
    type: string;
    area: string;
  };
  authenticity: {
    score: number;
    concerns: string[];
  };
}

/**
 * Convert image file to base64 for Gemini
 */
async function fileToGenerativePart(filePath: string, mimeType: string) {
  const data = await fs.readFile(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
}

/**
 * Analyze images using Gemini Vision
 */
async function analyzeImages(imagePaths: string[]): Promise<ImageAnalysis[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  const analyses: ImageAnalysis[] = [];

  for (const imagePath of imagePaths) {
    try {
      const prompt = `
      Analyze this image for mangrove ecosystem damage or environmental threats. Provide a detailed assessment including:

      1. Environmental features visible (mangrove trees, root systems, water bodies, wildlife)
      2. Signs of damage or threats (cutting, pollution, construction, disturbance)
      3. Severity assessment (1-10 scale)
      4. Authenticity indicators (is this a real environmental photo?)
      5. Specific objects and activities detected

      Focus on:
      - Mangrove tree health and damage
      - Human activities or equipment
      - Water quality indicators
      - Biodiversity signs
      - Immediate threats or ongoing damage

      Respond in JSON format with the following structure:
      {
        "description": "detailed description of what you see",
        "detectedObjects": ["list of objects/features"],
        "environmentalFeatures": ["mangrove-specific features"],
        "damageAssessment": {
          "severity": number (1-10),
          "type": "type of damage",
          "area": "estimated affected area"
        },
        "authenticity": {
          "score": number (0-1),
          "concerns": ["any authenticity concerns"]
        }
      }
      `;

      const imagePart = await fileToGenerativePart(imagePath, 'image/jpeg');
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      try {
        const analysis = JSON.parse(text);
        analyses.push(analysis);
      } catch (parseError) {
        logger.error('Failed to parse Gemini response:', parseError);
        analyses.push({
          description: text,
          detectedObjects: [],
          environmentalFeatures: [],
          damageAssessment: {
            severity: 5,
            type: 'unknown',
            area: 'unknown'
          },
          authenticity: {
            score: 0.5,
            concerns: ['Unable to parse AI response']
          }
        });
      }
    } catch (error) {
      logger.error('Image analysis failed:', error);
      analyses.push({
        description: 'Analysis failed',
        detectedObjects: [],
        environmentalFeatures: [],
        damageAssessment: {
          severity: 0,
          type: 'error',
          area: 'unknown'
        },
        authenticity: {
          score: 0,
          concerns: ['Analysis failed']
        }
      });
    }
  }

  return analyses;
}

/**
 * Validate incident using Gemini Pro
 */
async function validateIncident(
  title: string,
  description: string,
  location: any,
  reportedType: string,
  imageAnalyses: ImageAnalysis[] = []
): Promise<ValidationResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
  Analyze this mangrove incident report for validity and provide comprehensive assessment:

  INCIDENT DETAILS:
  Title: ${title}
  Description: ${description}
  Location: ${location.address || `${location.latitude}, ${location.longitude}`}
  Reported Type: ${reportedType}
  
  ${imageAnalyses.length > 0 ? `IMAGE ANALYSIS RESULTS: ${JSON.stringify(imageAnalyses)}` : ''}

  Provide a thorough validation assessment focusing on:

  1. VALIDITY: Is this a legitimate mangrove conservation concern?
  2. INCIDENT TYPE: Verify/correct the reported incident type
  3. SEVERITY: Assess environmental impact severity
  4. URGENCY: Determine if immediate action is needed
  5. CONSISTENCY: Check if description matches images and location
  6. ENVIRONMENTAL IMPACT: Assess damage to mangrove ecosystem
  7. RECOMMENDATIONS: Suggest appropriate response actions

  Consider these mangrove-specific factors:
  - Tidal zone characteristics
  - Mangrove species identification
  - Root system damage
  - Water quality impacts
  - Wildlife habitat disruption
  - Coastal protection implications

  Respond in JSON format:
  {
    "isValid": boolean,
    "confidence": number (0-1),
    "incidentType": "verified incident type",
    "severity": "low|medium|high|critical",
    "analysis": {
      "environmentalDamage": {
        "detected": boolean,
        "description": "damage description",
        "extent": "damage extent"
      },
      "mangroveFeatures": {
        "treesVisible": boolean,
        "rootSystemDamage": boolean,
        "waterBodyPresent": boolean,
        "biodiversityIndicators": ["indicators"]
      },
      "humanActivity": {
        "evidenceFound": boolean,
        "activityType": ["activities"],
        "equipment": ["equipment seen"]
      },
      "urgencyFactors": {
        "immediateAction": boolean,
        "spreadingRisk": boolean,
        "criticalHabitat": boolean
      }
    },
    "recommendations": ["action recommendations"],
    "flaggedConcerns": ["concerns or red flags"],
    "geoContext": {
      "locationRelevance": boolean,
      "knownThreats": ["known threats in area"],
      "protectedArea": boolean
    }
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return JSON.parse(text);
  } catch (error) {
    logger.error('Validation failed:', error);
    // Return fallback validation
    return {
      isValid: true,
      confidence: 0.5,
      incidentType: reportedType,
      severity: 'medium',
      analysis: {
        environmentalDamage: {
          detected: true,
          description: 'Unable to analyze with AI - manual review required',
          extent: 'unknown'
        },
        mangroveFeatures: {
          treesVisible: false,
          rootSystemDamage: false,
          waterBodyPresent: false,
          biodiversityIndicators: []
        },
        humanActivity: {
          evidenceFound: false,
          activityType: [],
          equipment: []
        },
        urgencyFactors: {
          immediateAction: false,
          spreadingRisk: false,
          criticalHabitat: false
        }
      },
      recommendations: [
        'Manual expert review required',
        'Verify incident details with local authorities',
        'Collect additional evidence if possible'
      ],
      flaggedConcerns: [
        'AI analysis unavailable - requires human validation'
      ],
      geoContext: {
        locationRelevance: true,
        knownThreats: [],
        protectedArea: false
      }
    };
  }
}

/**
 * POST /api/ai-validation/validate-incident
 * Validate an incident using AI
 */
router.post('/validate-incident',
  authenticateToken,
  aiValidationLimiter,
  upload.array('images', 5),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('type').notEmpty().withMessage('Incident type is required'),
    body('location.latitude').isFloat().withMessage('Valid latitude is required'),
    body('location.longitude').isFloat().withMessage('Valid longitude is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, type, location } = req.body;
      const files = req.files as Express.Multer.File[];
      const imagePaths = files ? files.map(file => file.path) : [];

      // Analyze images if provided
      let imageAnalyses: ImageAnalysis[] = [];
      if (imagePaths.length > 0) {
        imageAnalyses = await analyzeImages(imagePaths);
      }

      // Validate incident
      const validation = await validateIncident(
        title,
        description,
        typeof location === 'string' ? JSON.parse(location) : location,
        type,
        imageAnalyses
      );

      // Clean up uploaded files
      for (const imagePath of imagePaths) {
        try {
          await fs.unlink(imagePath);
        } catch (error) {
          logger.error('Failed to delete uploaded file:', error);
        }
      }

      // Log validation for monitoring
      logger.info(`AI Validation completed for user ${req.user?.id}:`, {
        incidentType: type,
        confidence: validation.confidence,
        isValid: validation.isValid,
        severity: validation.severity
      });

      res.json({
        success: true,
        validation,
        imageAnalyses: imageAnalyses.length > 0 ? imageAnalyses : undefined
      });

    } catch (error) {
      logger.error('AI validation error:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Failed to delete uploaded file:', unlinkError);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: 'AI validation failed',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/ai-validation/stats
 * Get AI validation statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you would query your database for these stats
    const stats = {
      totalValidations: 1250,
      averageConfidence: 0.87,
      validIncidents: 1089,
      invalidIncidents: 161,
      severityBreakdown: {
        low: 312,
        medium: 456,
        high: 321,
        critical: 161
      },
      topIncidentTypes: [
        { type: 'illegal_cutting', count: 445 },
        { type: 'pollution', count: 298 },
        { type: 'land_reclamation', count: 234 },
        { type: 'wildlife_disturbance', count: 273 }
      ]
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Stats retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stats',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

export default router;
