import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Message } from '../message.entity';
import { Visit } from '../visit.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? process.env.POSTGRES_DB ?? 'simple_site',
  entities: [Visit, Message],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
});

export default AppDataSource;
