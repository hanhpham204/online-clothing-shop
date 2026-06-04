import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export const REDIS_PUBLISHER = 'REDIS_PUBLISHER';

function buildRedisOptions(configService: ConfigService): RedisOptions {
  return {
    host: configService.get<string>('REDIS_HOST') || 'localhost',
    port: Number(configService.get<string>('REDIS_PORT') || '6379'),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    username: configService.get<string>('REDIS_USERNAME') || undefined,
    // Keep retrying instead of crashing bootstrap if Redis is briefly unreachable.
    enableOfflineQueue: true,
    // Required for blocking commands (XREADGROUP) used by stream consumers.
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    lazyConnect: false,
  };
}

export function createRedisClient(configService: ConfigService, label = 'RedisClient'): Redis {
  const logger = new Logger(label);
  const client = new Redis(buildRedisOptions(configService));
  client.on('error', (err) => logger.error(`Redis error: ${err.message}`));
  client.on('ready', () => logger.log(`${label} connected`));
  return client;
}
