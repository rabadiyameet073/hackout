import { createClient } from 'redis';
import { logger } from '@/utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
  retry_delay_on_failure: 100,
  retry_delay_on_cluster_down: 100,
  retry_delay_on_failover: 100,
  max_attempts: 3,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis client ready');
});

redisClient.on('end', () => {
  logger.info('❌ Redis client disconnected');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    logger.info('✅ Redis connection established');
  } catch (error) {
    logger.error('❌ Failed to connect to Redis:', error);
    throw error;
  }
}

// Redis utility functions
export class RedisService {
  static async set(key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        await redisClient.setEx(key, expireInSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  static async incr(key: string): Promise<number> {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      throw error;
    }
  }

  static async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      throw error;
    }
  }

  // Cache user sessions
  static async setUserSession(userId: string, sessionData: any, expireInSeconds: number = 86400): Promise<void> {
    await this.set(`session:${userId}`, sessionData, expireInSeconds);
  }

  static async getUserSession(userId: string): Promise<any> {
    return await this.get(`session:${userId}`);
  }

  static async deleteUserSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // Cache incident data
  static async cacheIncident(incidentId: string, incidentData: any, expireInSeconds: number = 3600): Promise<void> {
    await this.set(`incident:${incidentId}`, incidentData, expireInSeconds);
  }

  static async getCachedIncident(incidentId: string): Promise<any> {
    return await this.get(`incident:${incidentId}`);
  }

  // Rate limiting
  static async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${identifier}`;
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.expire(key, windowSeconds);
    }
    
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    
    return { allowed, remaining };
  }
}
