/**
 * Executes TypeORM migration commands through Bun.
 * Author : Sandip Sapkota <dev-sandip>
 */
import { spawn } from 'node:child_process';

const [action, migrationName] = process.argv.slice(2);

const DATA_SOURCE = 'src/database/data-source.ts';

const MIGRATIONS_DIR = 'src/database/migrations';

const usage = () => {
  console.log(`
Usage:
  bun run migration generate <MigrationName>
  bun run migration run
  bun run migration revert
  bun run migration show

Examples:
  bun run migration generate CreateAuthAndSessionTable
  bun run migration run
  bun run migration revert
  bun run migration show
`);
};

const actions = ['generate', 'run', 'revert', 'show'] as const;

if (!actions.includes(action as (typeof actions)[number])) {
  console.error('Error: Invalid or missing migration action.');
  usage();
  process.exit(1);
}

if (action === 'generate' && !migrationName) {
  console.error('Error: Migration name is required.');
  usage();
  process.exit(1);
}

if (action !== 'generate' && migrationName) {
  console.error(`Error: "${action}" does not accept a migration name.`);
  usage();
  process.exit(1);
}

if (action === 'generate' && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(migrationName!)) {
  console.error('Error: Invalid migration name.');
  process.exit(1);
}

const commandArgs = ['typeorm-ts-node-esm', `migration:${action}`];

if (action === 'generate') {
  commandArgs.push(`${MIGRATIONS_DIR}/${migrationName}`);
}

commandArgs.push('-d', DATA_SOURCE);

const child = spawn('bunx', commandArgs, {
  stdio: 'inherit',
  shell: false,
});

child.on('error', (error) => {
  console.error('Failed to execute TypeORM:', error.message);
  process.exitCode = 1;
});

child.on('close', (code) => {
  process.exitCode = code ?? 1;
});
