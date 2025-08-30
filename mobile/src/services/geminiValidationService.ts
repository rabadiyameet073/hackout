import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export interface ValidationResult {
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
  geoContext?: {
    locationRelevance: boolean;
    knownThreats: string[];
    protectedArea: boolean;
  };
}

export interface ImageAnalysis {
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

class GeminiValidationService {
  private model: any;
  private visionModel: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  /**
   * Analyze incident images using Gemini Vision
   */
  async analyzeImages(imageUris: string[]): Promise<ImageAnalysis[]> {
    try {
      const analyses: ImageAnalysis[] = [];

      for (const imageUri of imageUris) {
        const base64Image = await this.convertImageToBase64(imageUri);
        
        const prompt = `
        Analyze this image for mangrove ecosystem damage or threats. Provide a detailed assessment including:

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

        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        };

        const result = await this.visionModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        try {
          const analysis = JSON.parse(text);
          analyses.push(analysis);
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', parseError);
          // Fallback analysis
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
      }

      return analyses;
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw new Error('Failed to analyze images with AI');
    }
  }

  /**
   * Validate incident report using text analysis
   */
  async validateIncidentReport(
    title: string,
    description: string,
    location: { latitude: number; longitude: number; address?: string },
    reportedType: string,
    imageAnalyses?: ImageAnalysis[]
  ): Promise<ValidationResult> {
    try {
      const locationContext = await this.getLocationContext(location);
      
      const prompt = `
      Analyze this mangrove incident report for validity and provide comprehensive assessment:

      INCIDENT DETAILS:
      Title: ${title}
      Description: ${description}
      Location: ${location.address || `${location.latitude}, ${location.longitude}`}
      Reported Type: ${reportedType}
      
      ${imageAnalyses ? `IMAGE ANALYSIS RESULTS: ${JSON.stringify(imageAnalyses)}` : ''}
      
      ${locationContext ? `LOCATION CONTEXT: ${JSON.stringify(locationContext)}` : ''}

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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const validation = JSON.parse(text);
        return validation;
      } catch (parseError) {
        console.error('Failed to parse validation response:', parseError);
        // Return fallback validation
        return this.createFallbackValidation(title, description, reportedType);
      }
    } catch (error) {
      console.error('Validation failed:', error);
      throw new Error('Failed to validate incident with AI');
    }
  }

  /**
   * Get contextual information about the location
   */
  private async getLocationContext(location: { latitude: number; longitude: number }) {
    try {
      const prompt = `
      Analyze this geographic location for mangrove ecosystem context:
      Latitude: ${location.latitude}
      Longitude: ${location.longitude}

      Provide information about:
      1. Is this location likely to have mangrove ecosystems?
      2. Known environmental threats in this region
      3. Protected area status
      4. Typical mangrove species in this area
      5. Common conservation challenges

      Respond in JSON format:
      {
        "mangrovePresence": boolean,
        "ecosystemType": "type of mangrove ecosystem",
        "commonThreats": ["threats"],
        "protectedStatus": boolean,
        "conservationPriority": "low|medium|high",
        "typicalSpecies": ["species"]
      }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return JSON.parse(text);
    } catch (error) {
      console.error('Location context analysis failed:', error);
      return null;
    }
  }

  /**
   * Convert image URI to base64
   */
  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw new Error('Image processing failed');
    }
  }

  /**
   * Create fallback validation when AI analysis fails
   */
  private createFallbackValidation(
    title: string, 
    description: string, 
    reportedType: string
  ): ValidationResult {
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
      ]
    };
  }

  /**
   * Batch validate multiple incidents
   */
  async batchValidateIncidents(incidents: any[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const incident of incidents) {
      try {
        let imageAnalyses: ImageAnalysis[] = [];
        
        if (incident.images && incident.images.length > 0) {
          imageAnalyses = await this.analyzeImages(incident.images);
        }

        const validation = await this.validateIncidentReport(
          incident.title,
          incident.description,
          incident.location,
          incident.type,
          imageAnalyses
        );

        results.push(validation);
      } catch (error) {
        console.error(`Failed to validate incident ${incident.id}:`, error);
        results.push(this.createFallbackValidation(
          incident.title,
          incident.description,
          incident.type
        ));
      }
    }

    return results;
  }

  /**
   * Generate incident summary for authorities
   */
  async generateIncidentSummary(
    incident: any,
    validation: ValidationResult
  ): Promise<string> {
    try {
      const prompt = `
      Generate a professional incident summary for environmental authorities based on this validated mangrove incident:

      INCIDENT: ${incident.title}
      DESCRIPTION: ${incident.description}
      LOCATION: ${incident.location.address || `${incident.location.latitude}, ${incident.location.longitude}`}
      VALIDATION: ${JSON.stringify(validation)}

      Create a concise, professional summary that includes:
      1. Executive summary
      2. Environmental impact assessment
      3. Recommended actions
      4. Urgency level
      5. Required resources

      Format for official reporting to conservation authorities.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return `Incident Summary: ${incident.title}\nLocation: ${incident.location.address}\nRequires manual review due to AI processing error.`;
    }
  }
}

export const geminiValidationService = new GeminiValidationService();
