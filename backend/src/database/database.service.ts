import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickHouseAdapter } from './clickhouse.adapter';
import {
  DatabaseAdapter,
  DatabaseType,
  StoredMessage,
  StoredVisit,
  SUPPORTED_DATABASES,
} from './database.types';
import { MongoDbAdapter } from './mongodb.adapter';
import { SqlAdapter } from './sql.adapter';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  readonly type: DatabaseType;
  readonly host: string;
  readonly port: number;
  readonly database: string;
  private readonly adapter: DatabaseAdapter;

  constructor(private readonly config: ConfigService) {
    this.type = this.getDatabaseType();
    this.host = this.get(
      'DB_HOST',
      this.legacyPostgresValue('POSTGRES_HOST', this.defaultHost()),
    );
    this.port = this.getNumber(
      'DB_PORT',
      Number(
        this.legacyPostgresValue('POSTGRES_PORT', String(this.defaultPort())),
      ),
    );
    this.database = this.get(
      'DB_NAME',
      this.legacyPostgresValue('POSTGRES_DB', 'simple_site'),
    );
    this.adapter = this.createAdapter();
  }

  async onModuleInit(): Promise<void> {
    await this.adapter.connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.adapter.close();
  }

  recordVisit(): Promise<StoredVisit> {
    return this.adapter.recordVisit();
  }

  countVisits(): Promise<number> {
    return this.adapter.countVisits();
  }

  listMessages(limit = 20): Promise<StoredMessage[]> {
    return this.adapter.listMessages(limit);
  }

  saveMessage(text: string): Promise<StoredMessage> {
    return this.adapter.saveMessage(text);
  }

  ping(): Promise<void> {
    return this.adapter.ping();
  }

  private createAdapter(): DatabaseAdapter {
    const username = this.get(
      'DB_USER',
      this.legacyPostgresValue('POSTGRES_USER', this.defaultUsername()),
    );
    const password = this.get(
      'DB_PASSWORD',
      this.legacyPostgresValue('POSTGRES_PASSWORD', this.defaultPassword()),
    );
    const autoCreateSchema =
      this.get('DB_AUTO_CREATE_SCHEMA', 'true').toLowerCase() === 'true';

    if (this.type === 'mongodb') {
      const uri = this.config.get<string>('DB_URL')?.trim();
      const connectionUri =
        uri ||
        `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${this.host}:${this.port}`;
      return new MongoDbAdapter(connectionUri, this.database, autoCreateSchema);
    }

    if (this.type === 'clickhouse') {
      const url =
        this.config.get<string>('DB_URL')?.trim() ||
        `http://${this.host}:${this.port}`;
      return new ClickHouseAdapter(
        url,
        username,
        password,
        this.database,
        autoCreateSchema,
      );
    }

    return new SqlAdapter({
      type: this.type,
      host: this.host,
      port: this.port,
      username,
      password,
      database: this.database,
      autoCreateSchema,
    });
  }

  private getDatabaseType(): DatabaseType {
    const value = this.get('DB_TYPE', 'postgres').toLowerCase();
    if (!SUPPORTED_DATABASES.includes(value as DatabaseType)) {
      throw new Error(
        `Unsupported DB_TYPE "${value}". Use one of: ${SUPPORTED_DATABASES.join(', ')}`,
      );
    }
    return value as DatabaseType;
  }

  private defaultHost(): string {
    return 'localhost';
  }

  private defaultPort(): number {
    return {
      postgres: 5432,
      mysql: 3306,
      mongodb: 27017,
      clickhouse: 8123,
    }[this.type];
  }

  private defaultUsername(): string {
    return {
      postgres: 'postgres',
      mysql: 'root',
      mongodb: 'root',
      clickhouse: 'default',
    }[this.type];
  }

  private defaultPassword(): string {
    return this.type === 'postgres' ? 'postgres' : '';
  }

  private get(key: string, fallback: string): string {
    return this.config.get<string>(key, fallback);
  }

  private legacyPostgresValue(key: string, fallback: string): string {
    return this.type === 'postgres'
      ? this.config.get<string>(key, fallback)
      : fallback;
  }

  private getNumber(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key, String(fallback)));
    if (!Number.isInteger(value) || value <= 0 || value > 65535) {
      throw new Error(`${key} must be a valid TCP port`);
    }
    return value;
  }
}
