import { ClickHouseClient, createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import { DatabaseAdapter, StoredMessage, StoredVisit } from './database.types';

interface ClickHouseMessageRow {
  id: string;
  text: string;
  createdAt: string;
}

export class ClickHouseAdapter implements DatabaseAdapter {
  private readonly client: ClickHouseClient;

  constructor(
    url: string,
    username: string,
    password: string,
    database: string,
    private readonly autoCreateSchema: boolean,
  ) {
    this.client = createClient({ url, username, password, database });
  }

  async connect(): Promise<void> {
    await this.ping();
    if (this.autoCreateSchema) {
      await this.createSchema();
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async recordVisit(): Promise<StoredVisit> {
    const id = randomUUID();
    const createdAt = new Date();
    await this.client.insert({
      table: 'visits',
      values: [{ id, createdAt: this.formatDate(createdAt) }],
      format: 'JSONEachRow',
    });
    return { id, createdAt };
  }

  async countVisits(): Promise<number> {
    const result = await this.client.query({
      query: 'SELECT count() AS count FROM visits',
      format: 'JSONEachRow',
    });
    const rows = await result.json<{ count: string }>();
    return Number(rows[0]?.count ?? 0);
  }

  async listMessages(limit: number): Promise<StoredMessage[]> {
    const result = await this.client.query({
      query:
        'SELECT id, text, createdAt FROM messages ORDER BY createdAt DESC LIMIT {limit:UInt32}',
      query_params: { limit },
      format: 'JSONEachRow',
    });
    const rows = await result.json<ClickHouseMessageRow>();
    return rows.map((row) => ({
      id: row.id,
      text: row.text,
      createdAt: this.parseDate(row.createdAt),
    }));
  }

  async saveMessage(text: string): Promise<StoredMessage> {
    const id = randomUUID();
    const createdAt = new Date();
    await this.client.insert({
      table: 'messages',
      values: [{ id, text, createdAt: this.formatDate(createdAt) }],
      format: 'JSONEachRow',
    });
    return { id, text, createdAt };
  }

  async ping(): Promise<void> {
    const response = await this.client.ping();
    if (!response.success) {
      throw new Error('ClickHouse ping failed');
    }
  }

  private async createSchema(): Promise<void> {
    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS visits (
          id UUID,
          createdAt DateTime64(3, 'UTC')
        ) ENGINE = MergeTree
        ORDER BY (createdAt, id)
      `,
    });
    await this.client.command({
      query: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID,
          text String,
          createdAt DateTime64(3, 'UTC')
        ) ENGINE = MergeTree
        ORDER BY (createdAt, id)
      `,
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  private parseDate(value: string): Date {
    return new Date(`${value.replace(' ', 'T')}Z`);
  }
}
