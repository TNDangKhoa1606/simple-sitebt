import { DataSource } from 'typeorm';
import {
  DatabaseAdapter,
  DatabaseType,
  StoredMessage,
  StoredVisit,
} from './database.types';

type SqlDatabaseType = Extract<DatabaseType, 'postgres' | 'mysql'>;

export interface SqlAdapterOptions {
  type: SqlDatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  autoCreateSchema: boolean;
}

export class SqlAdapter implements DatabaseAdapter {
  private readonly dataSource: DataSource;

  constructor(private readonly options: SqlAdapterOptions) {
    this.dataSource = new DataSource({
      type: options.type,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: options.database,
    });
  }

  async connect(): Promise<void> {
    await this.dataSource.initialize();
    if (this.options.autoCreateSchema) {
      await this.createSchema();
    }
  }

  async close(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async recordVisit(): Promise<StoredVisit> {
    const createdAt = new Date();
    if (this.options.type === 'postgres') {
      const rows = await this.query<Record<string, unknown>[]>(
        'INSERT INTO "visits" ("createdAt") VALUES ($1) RETURNING "id", "createdAt"',
        [createdAt],
      );
      return this.toVisit(rows[0]);
    }

    const result = await this.query<{ insertId: number | string }>(
      'INSERT INTO `visits` (`createdAt`) VALUES (?)',
      [createdAt],
    );
    return { id: result.insertId, createdAt };
  }

  async countVisits(): Promise<number> {
    const table = this.quote('visits');
    const rows = await this.query<Array<{ count: string | number }>>(
      `SELECT COUNT(*) AS count FROM ${table}`,
    );
    return Number(rows[0].count);
  }

  async listMessages(limit: number): Promise<StoredMessage[]> {
    const table = this.quote('messages');
    const rows = await this.query<Record<string, unknown>[]>(
      `SELECT ${this.quote('id')}, ${this.quote('text')}, ${this.quote('createdAt')} FROM ${table} ORDER BY ${this.quote('createdAt')} DESC LIMIT ${Number(limit)}`,
    );
    return rows.map((row: Record<string, unknown>) => this.toMessage(row));
  }

  async saveMessage(text: string): Promise<StoredMessage> {
    const createdAt = new Date();
    if (this.options.type === 'postgres') {
      const rows = await this.query<Record<string, unknown>[]>(
        'INSERT INTO "messages" ("text", "createdAt") VALUES ($1, $2) RETURNING "id", "text", "createdAt"',
        [text, createdAt],
      );
      return this.toMessage(rows[0]);
    }

    const result = await this.query<{ insertId: number | string }>(
      'INSERT INTO `messages` (`text`, `createdAt`) VALUES (?, ?)',
      [text, createdAt],
    );
    return { id: result.insertId, text, createdAt };
  }

  async ping(): Promise<void> {
    await this.dataSource.query('SELECT 1');
  }

  private async createSchema(): Promise<void> {
    if (this.options.type === 'postgres') {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "visits" (
          "id" SERIAL PRIMARY KEY,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "messages" (
          "id" SERIAL PRIMARY KEY,
          "text" VARCHAR(280) NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      return;
    }

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS \`visits\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      )
    `);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS \`messages\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`text\` VARCHAR(280) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      )
    `);
  }

  private quote(identifier: string): string {
    return this.options.type === 'postgres'
      ? `"${identifier}"`
      : `\`${identifier}\``;
  }

  private async query<T>(sql: string, parameters?: unknown[]): Promise<T> {
    const result: unknown = await this.dataSource.query(sql, parameters);
    return result as T;
  }

  private toVisit(row: Record<string, unknown>): StoredVisit {
    return {
      id: row.id as number | string,
      createdAt: new Date(row.createdAt as string | Date),
    };
  }

  private toMessage(row: Record<string, unknown>): StoredMessage {
    return {
      id: row.id as number | string,
      text: String(row.text),
      createdAt: new Date(row.createdAt as string | Date),
    };
  }
}
