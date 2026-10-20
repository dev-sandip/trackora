import { Generated } from 'kysely';

export interface UsersTable {
  id: Generated<number>;
  name: string;
  email: string;
}

export interface DB {
  users: UsersTable;
}