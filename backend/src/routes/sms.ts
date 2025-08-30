import express from 'express';
import twilio from 'twilio';
import { body, validationResult } from 'express-validator';
import { supabase } from '@/config/database';
import { RedisService } from '@/config/redis';
import { asyncHandler, validationError, rateLimitError } from '@/middleware/errorHandler';
import { authenticate, authorize, AuthenticatedRequest } from '@/middleware/auth';
import { logger, loggerHelpers } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validation rules
const sendSmsValidation = [
  body('phone').isMobilePhone('any').withMessage('Valid phone number required'),
  body('message').isLength({ min: 1, max: 1600 }).withMessage('Message must be 1-1600 characters')
];

// @desc    Receive SMS incident reports (webhook)
// @route   POST /api/sms/webhook
// @access  Public (Twilio webhook)
router.post('/webhook', asyncHandler(async (req, res) => {
  const { From, Body, MessageSid } = req.body;

  if (!From || !Body) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // Parse SMS message for incident report
    const parsedReport = parseSmsIncidentReport(Body);
    
    if (!parsedReport) {
      // Send help message
      await sendSmsResponse(From, 
        "📱 Mangrove Watch SMS Reporting\n\n" +
        "Format: REPORT [TYPE] [SEVERITY] [DESCRIPTION] at [LOCATION]\n\n" +
        "Types: CUTTING, POLLUTION, RECLAMATION, WILDLIFE, OTHER\n" +
        "Severity: LOW, MEDIUM, HIGH, CRITICAL\n\n" +
        "Example: REPORT CUTTING HIGH Illegal mangrove cutting observed at Coastal Road, Barangay Marina\n\n" +
        "For help: Reply HELP"
      );
      return res.status(200).send('Help message sent');
    }

    // Check if user exists by phone number
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, is_verified')
      .eq('phone', From)
      .single();

    if (userError || !user) {
      // Create anonymous user for SMS reporting
      const userId = uuidv4();
      const username = `sms_user_${From.slice(-4)}_${Date.now().toString().slice(-4)}`;
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `${username}@sms.mangrovewatch.org`,
          username,
          full_name: `SMS User ${From}`,
          phone: From,
          role: 'community_member',
          points: 0,
          level: 1,
          badges: [],
          is_verified: true, // Auto-verify SMS users
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, username, is_verified')
        .single();

      if (createError) {
        logger.error('Failed to create SMS user:', createError);
        await sendSmsResponse(From, "❌ Error processing your report. Please try again later.");
        return res.status(500).send('User creation failed');
      }

      user = newUser;
    }

    if (!user.is_verified) {
      await sendSmsResponse(From, "❌ Your account needs verification. Please contact support.");
      return res.status(400).send('User not verified');
    }

    // Create incident report
    const incidentId = uuidv4();
    const incidentData = {
      id: incidentId,
      user_id: user.id,
      title: `SMS Report: ${parsedReport.type}`,
      description: parsedReport.description,
      type: parsedReport.type,
      severity: parsedReport.severity,
      location: parsedReport.location,
      images: [],
      status: 'pending',
      validation_score: 0,
      ai_confidence: 0,
      tags: ['sms_report'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .insert(incidentData)
      .select()
      .single();

    if (incidentError) {
      logger.error('Failed to create SMS incident:', incidentError);
      await sendSmsResponse(From, "❌ Error saving your report. Please try again later.");
      return res.status(500).send('Incident creation failed');
    }

    // Award points for SMS reporting
    const pointsEarned = parseInt(process.env.POINTS_PER_REPORT || '10');
    await supabase
      .from('users')
      .update({ 
        points: supabase.raw(`points + ${pointsEarned}`),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Log gamification event
    await supabase
      .from('gamification')
      .insert({
        id: uuidv4(),
        user_id: user.id,
        action_type: 'report_incident',
        points_earned: pointsEarned,
        created_at: new Date().toISOString()
      });

    // Store SMS message reference
    await RedisService.set(`sms:${MessageSid}`, {
      incidentId,
      userId: user.id,
      phone: From,
      processed: true
    }, 86400); // 24 hours

    // Send confirmation
    await sendSmsResponse(From, 
      `✅ Report received! ID: ${incidentId.slice(0, 8)}\n` +
      `Type: ${parsedReport.type}\n` +
      `Severity: ${parsedReport.severity}\n` +
      `Points earned: +${pointsEarned}\n\n` +
      `Your report is being reviewed. Thank you for protecting our mangroves! 🌿`
    );

    loggerHelpers.logIncidentReport(incidentId, user.id, parsedReport.type, parsedReport.location);

    res.status(200).send('SMS processed successfully');

  } catch (error: any) {
    logger.error('SMS webhook error:', error);
    await sendSmsResponse(From, "❌ Error processing your report. Please try again later.");
    res.status(500).send('Internal server error');
  }
}));

// @desc    Send SMS notification
// @route   POST /api/sms/send
// @access  Private (admin only)
router.post('/send', authenticate, authorize('admin'), sendSmsValidation, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationError(errors.array().map(err => err.msg).join(', '));
  }

  const { phone, message } = req.body;
  const userId = req.user!.id;

  // Rate limiting for SMS sending
  const rateLimitKey = `sms_send:${userId}`;
  const { allowed } = await RedisService.checkRateLimit(rateLimitKey, 10, 3600); // 10 SMS per hour

  if (!allowed) {
    throw rateLimitError('SMS rate limit exceeded. Maximum 10 SMS per hour.');
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phone
    });

    loggerHelpers.logUserAction(userId, 'sms_sent', { 
      to: phone, 
      messageSid: result.sid,
      messageLength: message.length 
    });

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        sid: result.sid,
        status: result.status
      }
    });

  } catch (error: any) {
    logger.error('Failed to send SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}));

// @desc    Get SMS statistics
// @route   GET /api/sms/stats
// @access  Private (admin only)
router.get('/stats', authenticate, authorize('admin'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { period = '30' } = req.query; // days
  const daysAgo = parseInt(period as string);
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  // Get SMS-related incidents
  const { data: smsIncidents, error } = await supabase
    .from('incidents')
    .select('id, created_at, status, type, severity')
    .contains('tags', ['sms_report'])
    .gte('created_at', startDate.toISOString());

  if (error) {
    logger.error('Failed to fetch SMS stats:', error);
    throw new Error('Failed to fetch SMS statistics');
  }

  const stats = {
    total_sms_reports: smsIncidents.length,
    reports_by_status: {
      pending: smsIncidents.filter(i => i.status === 'pending').length,
      under_review: smsIncidents.filter(i => i.status === 'under_review').length,
      verified: smsIncidents.filter(i => i.status === 'verified').length,
      rejected: smsIncidents.filter(i => i.status === 'rejected').length,
      resolved: smsIncidents.filter(i => i.status === 'resolved').length
    },
    reports_by_type: {
      illegal_cutting: smsIncidents.filter(i => i.type === 'illegal_cutting').length,
      pollution: smsIncidents.filter(i => i.type === 'pollution').length,
      land_reclamation: smsIncidents.filter(i => i.type === 'land_reclamation').length,
      wildlife_disturbance: smsIncidents.filter(i => i.type === 'wildlife_disturbance').length,
      other: smsIncidents.filter(i => i.type === 'other').length
    },
    reports_by_severity: {
      low: smsIncidents.filter(i => i.severity === 'low').length,
      medium: smsIncidents.filter(i => i.severity === 'medium').length,
      high: smsIncidents.filter(i => i.severity === 'high').length,
      critical: smsIncidents.filter(i => i.severity === 'critical').length
    },
    period_days: daysAgo
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

// Helper function to parse SMS incident report
function parseSmsIncidentReport(message: string): any {
  const text = message.trim().toUpperCase();
  
  // Check if message starts with REPORT
  if (!text.startsWith('REPORT')) {
    return null;
  }

  try {
    // Remove "REPORT" and parse the rest
    const content = text.substring(6).trim();
    
    // Extract type
    const typeMap: { [key: string]: string } = {
      'CUTTING': 'illegal_cutting',
      'POLLUTION': 'pollution',
      'RECLAMATION': 'land_reclamation',
      'WILDLIFE': 'wildlife_disturbance',
      'OTHER': 'other'
    };

    let type = 'other';
    let remainingContent = content;

    for (const [key, value] of Object.entries(typeMap)) {
      if (content.startsWith(key)) {
        type = value;
        remainingContent = content.substring(key.length).trim();
        break;
      }
    }

    // Extract severity
    const severityMap: { [key: string]: string } = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'CRITICAL': 'critical'
    };

    let severity = 'medium';
    for (const [key, value] of Object.entries(severityMap)) {
      if (remainingContent.startsWith(key)) {
        severity = value;
        remainingContent = remainingContent.substring(key.length).trim();
        break;
      }
    }

    // Extract location (look for "AT" keyword)
    let description = remainingContent;
    let location = { latitude: 0, longitude: 0, address: 'Location not specified' };

    const atIndex = remainingContent.indexOf(' AT ');
    if (atIndex !== -1) {
      description = remainingContent.substring(0, atIndex).trim();
      location.address = remainingContent.substring(atIndex + 4).trim();
    }

    return {
      type,
      severity,
      description: description || 'SMS incident report',
      location
    };

  } catch (error) {
    logger.error('Failed to parse SMS report:', error);
    return null;
  }
}

// Helper function to send SMS response
async function sendSmsResponse(to: string, message: string): Promise<void> {
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    });
  } catch (error) {
    logger.error('Failed to send SMS response:', error);
  }
}

export default router;
