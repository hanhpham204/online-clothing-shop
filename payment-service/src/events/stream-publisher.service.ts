import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { REDIS_PUBLISHER } from './redis-client';
import { EventEnvelope, StreamName } from './event-types';

export const STREAM_SOURCE_TOKEN = 'STREAM_SOURCE_TOKEN';

@Injectable()
export class StreamPublisherService {
  private readonly logger = new Logger(StreamPublisherService.name);
  private readonly maxLen: number;

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly redis: Redis,
    @Inject(STREAM_SOURCE_TOKEN) private readonly source: string,
    configService: ConfigService,
  ) {
    this.maxLen = Number(configService.get<string>('REDIS_STREAM_MAXLEN') || '10000');
  }

  async publish<TPayload>(
    stream: StreamName,
    payload: TPayload,
    options: { eventId?: string } = {},
  ): Promise<string> {
    const envelope: EventEnvelope<TPayload> = {
      eventId: options.eventId ?? uuidv4(),
      eventType: stream,
      occurredAt: new Date().toISOString(),
      source: this.source,
      payload,
    };
    const json = JSON.stringify(envelope);
    try {
      const id = (await this.redis.xadd(
        stream,
        'MAXLEN',
        '~',
        String(this.maxLen),
        '*',
        'envelope',
        json,
      )) as string | null;
      this.logger.log(
        `XADD ${stream} id=${id ?? '?'} eventId=${envelope.eventId} source=${this.source}`,
      );
      return id ?? '';
    } catch (err) {
      this.logger.error(
        `Failed XADD ${stream} (eventId=${envelope.eventId}): ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
