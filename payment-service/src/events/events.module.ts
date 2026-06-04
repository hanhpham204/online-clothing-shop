import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { REDIS_PUBLISHER, createRedisClient } from './redis-client';
import { STREAM_SOURCE_TOKEN, StreamPublisherService } from './stream-publisher.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_PUBLISHER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createRedisClient(configService, 'RedisPublisher'),
    },
    {
      provide: STREAM_SOURCE_TOKEN,
      useValue: 'payment-service',
    },
    StreamPublisherService,
  ],
  exports: [StreamPublisherService, REDIS_PUBLISHER],
})
export class EventsModule {}
