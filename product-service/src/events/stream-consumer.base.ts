import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient } from './redis-client';
import { EventEnvelope, StreamName } from './event-types';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function parseFields(fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i + 1 < fields.length; i += 2) {
    out[fields[i]] = fields[i + 1];
  }
  return out;
}

type RawEntry = [string, string[]];
type RawStream = [string, RawEntry[]];

@Injectable()
export abstract class StreamConsumer implements OnModuleInit, OnModuleDestroy {
  protected abstract readonly streamName: StreamName;
  protected abstract readonly groupName: string;
  protected abstract handle(envelope: EventEnvelope, messageId: string): Promise<void>;

  protected readonly logger = new Logger(this.constructor.name);
  private client!: Redis;
  private running = false;
  private loopDone?: Promise<void>;
  private claimTimer?: NodeJS.Timeout;
  private readonly consumerName: string;
  private readonly blockMs = 5000;
  private readonly idleMs = 30_000;

  constructor(private readonly configService: ConfigService) {
    const hostId = process.env.HOSTNAME || process.env.COMPUTERNAME || 'host';
    this.consumerName = `${hostId}-${process.pid}`;
  }

  async onModuleInit() {
    this.client = createRedisClient(this.configService, this.constructor.name);
    await this.ensureGroup();
    this.running = true;
    this.loopDone = this.runLoop();
    this.claimTimer = setInterval(() => {
      void this.claimStalePending();
    }, this.idleMs);
    this.logger.log(
      `Stream consumer started — stream=${this.streamName} group=${this.groupName} consumer=${this.consumerName}`,
    );
  }

  async onModuleDestroy() {
    this.running = false;
    if (this.claimTimer) clearInterval(this.claimTimer);
    try {
      await this.client?.quit();
    } catch {
      // ignore
    }
    try {
      await this.loopDone;
    } catch {
      // ignore
    }
  }

  private async ensureGroup() {
    try {
      await this.client.xgroup('CREATE', this.streamName, this.groupName, '$', 'MKSTREAM');
      this.logger.log(`Created consumer group ${this.groupName} on ${this.streamName}`);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('BUSYGROUP')) return;
      this.logger.error(`XGROUP CREATE ${this.streamName}/${this.groupName} failed: ${msg}`);
      throw err;
    }
  }

  private async runLoop() {
    await this.readOwnBacklog();
    while (this.running) {
      try {
        const res = (await this.client.xreadgroup(
          'GROUP',
          this.groupName,
          this.consumerName,
          'COUNT',
          '10',
          'BLOCK',
          String(this.blockMs),
          'STREAMS',
          this.streamName,
          '>',
        )) as RawStream[] | null;

        if (!res) continue;
        for (const [, entries] of res) {
          for (const [id, fields] of entries) {
            await this.processEntry(id, fields);
          }
        }
      } catch (err) {
        if (!this.running) break;
        this.logger.error(`XREADGROUP failed: ${(err as Error).message}`);
        await sleep(1500);
      }
    }
  }

  private async readOwnBacklog() {
    try {
      const res = (await this.client.xreadgroup(
        'GROUP',
        this.groupName,
        this.consumerName,
        'COUNT',
        '100',
        'STREAMS',
        this.streamName,
        '0',
      )) as RawStream[] | null;
      if (!res) return;
      for (const [, entries] of res) {
        if (entries.length > 0) {
          this.logger.warn(
            `Found ${entries.length} unacked pending entries from a previous run on ${this.streamName}`,
          );
        }
        for (const [id, fields] of entries) {
          await this.processEntry(id, fields);
        }
      }
    } catch (err) {
      this.logger.warn(`Initial backlog read failed: ${(err as Error).message}`);
    }
  }

  private async claimStalePending() {
    if (!this.running) return;
    try {
      let cursor = '0';
      let safety = 5;
      while (safety-- > 0 && this.running) {
        const result = (await (this.client as unknown as {
          xautoclaim: (...args: (string | number)[]) => Promise<unknown>;
        }).xautoclaim(
          this.streamName,
          this.groupName,
          this.consumerName,
          this.idleMs,
          cursor,
          'COUNT',
          25,
        )) as [string, RawEntry[], string[]?] | null;

        if (!result) return;
        const [nextCursor, claimed] = result;
        if (!claimed || claimed.length === 0) return;
        this.logger.log(
          `Claimed ${claimed.length} stale pending messages on ${this.streamName}`,
        );
        for (const [id, fields] of claimed) {
          await this.processEntry(id, fields);
        }
        cursor = nextCursor;
        if (cursor === '0' || cursor === '0-0' || !cursor) return;
      }
    } catch (err) {
      this.logger.warn(`XAUTOCLAIM failed: ${(err as Error).message}`);
    }
  }

  private async processEntry(id: string, fields: string[]) {
    const data = parseFields(fields);
    if (!data.envelope) {
      this.logger.error(`Missing 'envelope' field on ${this.streamName} id=${id}. Acking to skip.`);
      await this.safeAck(id);
      return;
    }
    let envelope: EventEnvelope;
    try {
      envelope = JSON.parse(data.envelope) as EventEnvelope;
    } catch (err) {
      this.logger.error(
        `Bad envelope JSON on ${this.streamName} id=${id}: ${(err as Error).message}. Acking to skip.`,
      );
      await this.safeAck(id);
      return;
    }
    try {
      await this.handle(envelope, id);
      await this.safeAck(id);
    } catch (err) {
      this.logger.error(
        `Handler failed on ${this.streamName} msgId=${id} eventId=${envelope.eventId}: ${(err as Error).message}. Leaving pending for retry.`,
      );
    }
  }

  private async safeAck(id: string) {
    try {
      await this.client.xack(this.streamName, this.groupName, id);
    } catch (err) {
      this.logger.warn(`XACK ${this.streamName} ${id} failed: ${(err as Error).message}`);
    }
  }
}
