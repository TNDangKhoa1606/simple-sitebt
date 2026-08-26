export const SUPPORTED_DATABASES = [
  'postgres',
  'mysql',
  'mongodb',
  'clickhouse',
] as const;

export type DatabaseType = (typeof SUPPORTED_DATABASES)[number];

export interface StoredVisit {
  id: number | string;
  createdAt: Date;
}

export interface StoredMessage {
  id: number | string;
  text: string;
  createdAt: Date;
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  close(): Promise<void>;
  recordVisit(): Promise<StoredVisit>;
  countVisits(): Promise<number>;
  listMessages(limit: number): Promise<StoredMessage[]>;
  saveMessage(text: string): Promise<StoredMessage>;
  ping(): Promise<void>;
}
