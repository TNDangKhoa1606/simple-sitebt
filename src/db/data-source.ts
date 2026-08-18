import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Message } from '../message.entity';
import { Visit } from '../visit.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'simple_site',
  entities: [Visit, Message],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
});

export default AppDataSource;
