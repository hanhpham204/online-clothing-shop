import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_PUBLISHER } from '../events/redis-client';

/**
 * Lightweight dedupe cache for stream consumers. Stream redelivery means we
 * may see the same event more than once (e.g. after a crash or claim sweep);
 * we want to send each notification email exactly once.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly ttlSeconds = 60 * 60 * 24; // 24h dedupe window

  constructor(@Inject(REDIS_PUBLISHER) private readonly redis: Redis) {}

  /**
   * Returns true the FIRST time we see this key, false on subsequent calls
   * within the TTL window. If Redis is unavailable, we fail-open (return
   * true) so messages still get processed.
   */
  async claim(key: string): Promise<boolean> {
    const fullKey = `email:processed:${key}`;
    try {
      const result = await this.redis.set(fullKey, '1', 'EX', this.ttlSeconds, 'NX');
      return result === 'OK';
    } catch (err) {
      this.logger.warn(`Dedupe SET NX failed for ${fullKey}: ${(err as Error).message}. Failing open.`);
      return true;
    }
  }
}
