import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './db.types.js';


@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly db: Kysely<DB>;

  constructor(config: ConfigService) {
    this.db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: new Pool({
          host: config.get<string>('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 5432),
          user: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
        }),
      }),
    });
  }

  async onModuleDestroy() {
    await this.db.destroy();
  }
}