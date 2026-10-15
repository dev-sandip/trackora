
import { drizzle } from 'drizzle-orm/node-postgres';
import { ENV } from '../lib/env';
const db = drizzle({ 
  connection: { 
    connectionString: ENV.DATABASE_URL,
    ssl: true
  },
  logger:true,
});
 
export default db;
