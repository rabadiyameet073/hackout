import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'mangrove-watch-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console with a simple format
if (nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

// Helper functions for structured logging
export const loggerHelpers = {
  // Log user actions
  logUserAction: (userId: string, action: string, details?: any) => {
    logger.info('User action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  },

  // Log API requests
  logApiRequest: (method: string, url: string, userId?: string, duration?: number) => {
    logger.info('API request', {
      method,
      url,
      userId,
      duration,
      timestamp: new Date().toISOString()
    });
  },

  // Log security events
  logSecurityEvent: (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') => {
    logger.warn('Security event', {
      event,
      details,
      severity,
      timestamp: new Date().toISOString()
    });
  },

  // Log database operations
  logDatabaseOperation: (operation: string, table: string, recordId?: string, error?: any) => {
    if (error) {
      logger.error('Database operation failed', {
        operation,
        table,
        recordId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info('Database operation', {
        operation,
        table,
        recordId,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Log external API calls
  logExternalApiCall: (service: string, endpoint: string, method: string, statusCode?: number, duration?: number, error?: any) => {
    if (error) {
      logger.error('External API call failed', {
        service,
        endpoint,
        method,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info('External API call', {
        service,
        endpoint,
        method,
        statusCode,
        duration,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Log incident reports
  logIncidentReport: (incidentId: string, userId: string, type: string, location: any) => {
    logger.info('Incident reported', {
      incidentId,
      userId,
      type,
      location,
      timestamp: new Date().toISOString()
    });
  },

  // Log validation events
  logValidationEvent: (incidentId: string, validatorId: string, validationType: string, score: number) => {
    logger.info('Incident validated', {
      incidentId,
      validatorId,
      validationType,
      score,
      timestamp: new Date().toISOString()
    });
  }
};

export default logger;
