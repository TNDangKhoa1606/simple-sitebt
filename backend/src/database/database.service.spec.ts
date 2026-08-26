import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

describe('DatabaseService configuration', () => {
  const config = (values: Record<string, string>) =>
    new ConfigService(values, { skipProcessEnv: true });

  it('defaults to PostgreSQL', () => {
    const service = new DatabaseService(config({}));

    expect(service.type).toBe('postgres');
    expect(service.host).toBe('localhost');
    expect(service.port).toBe(5432);
    expect(service.database).toBe('simple_site');
  });

  it('configures a selected backend', () => {
    const service = new DatabaseService(
      config({
        DB_TYPE: 'mysql',
        DB_HOST: 'mysql.internal',
        DB_PORT: '3307',
        DB_NAME: 'site_test',
      }),
    );

    expect(service.type).toBe('mysql');
    expect(service.host).toBe('mysql.internal');
    expect(service.port).toBe(3307);
    expect(service.database).toBe('site_test');
  });

  it('supports legacy PostgreSQL variables', () => {
    const service = new DatabaseService(
      config({
        POSTGRES_HOST: 'legacy-postgres',
        POSTGRES_PORT: '5544',
        POSTGRES_DB: 'legacy_site',
      }),
    );

    expect(service.host).toBe('legacy-postgres');
    expect(service.port).toBe(5544);
    expect(service.database).toBe('legacy_site');
  });

  it('rejects unsupported database types', () => {
    expect(() => new DatabaseService(config({ DB_TYPE: 'sqlite' }))).toThrow(
      'Unsupported DB_TYPE',
    );
  });
});
