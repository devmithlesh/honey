/**
 * Interactive Supabase setup.
 *
 * Asks for the Supabase connection URI (or just the database password), writes
 * `DATABASE_URL` and `DB_SSL=true` into `.env`, proves the connection works, and
 * offers to run the migrations and seeders.
 *
 * The password is read with the echo suppressed and is never printed or logged.
 *
 *   cd backend && npm run db:supabase
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(HERE, '..', '.env');

const ESC = String.fromCharCode(27);
const c = {
  reset: `${ESC}[0m`,
  bold: `${ESC}[1m`,
  dim: `${ESC}[90m`,
  red: `${ESC}[31m`,
  green: `${ESC}[32m`,
  yellow: `${ESC}[33m`,
  cyan: `${ESC}[36m`,
};

const say = (message = '') => process.stdout.write(`${message}\n`);
const heading = (message) => say(`\n${c.bold}${c.cyan}${message}${c.reset}`);
const ok = (message) => say(`${c.green}OK${c.reset}  ${message}`);
const warn = (message) => say(`${c.yellow}!${c.reset}   ${message}`);
const fail = (message) => say(`${c.red}x${c.reset}   ${message}`);

/**
 * Output stream that can be silenced mid-prompt.
 *
 * This is the supported way to hide typed input with `readline`: the interface
 * echoes through this stream, and muting it drops those writes. Redrawing the
 * line from a `data` listener instead deadlocks when stdin is a pipe rather
 * than a terminal.
 */
let isMuted = false;

const maskedStdout = new Writable({
  write(chunk, encoding, callback) {
    if (!isMuted) process.stdout.write(chunk, encoding);
    callback();
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: maskedStdout,
  terminal: process.stdin.isTTY === true,
});

/**
 * Rejects instead of hanging when the input ends mid-question, which is what
 * happens if the script is piped input rather than run in a terminal. Without
 * this the promise never settles and Node exits silently with status 0, making
 * it look as though the script simply did nothing.
 */
const ask = (question) =>
  new Promise((resolve, reject) => {
    const onClose = () => reject(new Error('Input ended. Run this in a terminal: npm run db:supabase'));
    rl.once('close', onClose);
    rl.question(question, (answer) => {
      rl.removeListener('close', onClose);
      resolve(answer);
    });
  });

/** Prompts without echoing, so a password never reaches the terminal scrollback. */
const askHidden = async (question) => {
  // Without a terminal there is no echo to suppress, and muting would hide the
  // prompt itself, so a piped or redirected run simply asks normally.
  if (!process.stdin.isTTY) return ask(question);

  process.stdout.write(question);
  isMuted = true;
  try {
    return await ask('');
  } finally {
    isMuted = false;
    process.stdout.write('\n');
  }
};

/** `postgresql://user:pass@host/db` -> the same with the password masked. */
const maskUri = (uri) => uri.replace(/:\/\/([^:]+):([^@]*)@/, '://$1:******@');

const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;

const buildUri = (password, projectRef) =>
  `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

/**
 * Sets a key in the .env text, uncommenting it when necessary and appending it
 * when the key is absent entirely.
 */
const setEnvValue = (text, key, value) => {
  const active = new RegExp(`^${key}=.*$`, 'm');
  const commented = new RegExp(`^#\\s*${key}=.*$`, 'm');

  if (active.test(text)) return text.replace(active, `${key}=${value}`);
  if (commented.test(text)) return text.replace(commented, `${key}=${value}`);
  return `${text.trimEnd()}\n${key}=${value}\n`;
};

const testConnection = async (uri) => {
  const client = new pg.Client({
    connectionString: uri,
    // Supabase terminates TLS at a shared hostname, so the chain cannot be
    // verified against the URI host. The transport is still encrypted.
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  const { rows } = await client.query(
    'select current_database() as db, current_user as who, version() as version'
  );
  const { rows: tables } = await client.query(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public'"
  );
  await client.end();

  return { ...rows[0], publicTables: tables[0].n };
};

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: path.resolve(HERE, '..'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
};

const main = async () => {
  heading('Connect this backend to Supabase');

  if (!fs.existsSync(ENV_PATH)) {
    fail('backend/.env not found. Copy .env.example to .env first.');
    rl.close();
    process.exitCode = 1;
    return;
  }

  say(`${c.dim}Supabase dashboard -> Project Settings -> Database${c.reset}`);
  say(`${c.dim}  - "Database password" -> Reset database password -> copy it${c.reset}`);
  say(`${c.dim}  - or "Connection string" -> URI tab -> copy the whole line${c.reset}`);
  say();

  const pasted = (
    await ask(
      `${c.bold}Paste the connection URI, or press Enter to type the password only: ${c.reset}`
    )
  ).trim();

  let uri;

  if (pasted.startsWith('postgres://') || pasted.startsWith('postgresql://')) {
    if (pasted.includes('[YOUR-PASSWORD]')) {
      fail('That URI still has the [YOUR-PASSWORD] placeholder. Replace it with the real password.');
      rl.close();
      process.exitCode = 1;
      return;
    }
    uri = pasted;
  } else {
    if (pasted) {
      warn('That did not look like a connection URI, so treating it as the project reference.');
    }

    const projectRef =
      pasted ||
      (
        await ask(`${c.bold}Project reference ${c.dim}(the id in your dashboard URL)${c.reset}: `)
      ).trim();

    if (!PROJECT_REF_PATTERN.test(projectRef)) {
      fail(`"${projectRef}" is not a Supabase project reference (20 lowercase letters/digits).`);
      rl.close();
      process.exitCode = 1;
      return;
    }

    const password = await askHidden(`${c.bold}Database password ${c.dim}(hidden)${c.reset}: `);
    if (!password) {
      fail('No password entered.');
      rl.close();
      process.exitCode = 1;
      return;
    }

    uri = buildUri(password, projectRef);
  }

  if (uri.includes('pooler.supabase.com')) {
    warn('That is the connection pooler. Migrations need the direct host (db.<ref>.supabase.co).');
    const proceed = (await ask('Continue anyway? [y/N] ')).trim().toLowerCase();
    if (proceed !== 'y') {
      say('Cancelled.');
      rl.close();
      return;
    }
  }

  heading('Testing the connection');
  say(`${c.dim}${maskUri(uri)}${c.reset}`);

  let info;
  try {
    info = await testConnection(uri);
  } catch (error) {
    fail(`Could not connect: ${error.message}`);
    say();
    say('Common causes:');
    say('  - Wrong password. Reset it under Project Settings -> Database.');
    say('  - Project paused. Free projects sleep; open the dashboard to wake it.');
    say('  - A firewall is blocking outbound port 5432.');
    rl.close();
    process.exitCode = 1;
    return;
  }

  ok(`Connected as ${info.who} to ${info.db}`);
  say(`${c.dim}    ${info.version.split(',')[0]}${c.reset}`);
  say(`${c.dim}    the public schema currently holds ${info.publicTables} table(s)${c.reset}`);

  heading('Updating .env');

  const original = fs.readFileSync(ENV_PATH, 'utf8');
  const backupPath = `${ENV_PATH}.backup-${Date.now()}`;
  fs.writeFileSync(backupPath, original);

  let updated = setEnvValue(original, 'DATABASE_URL', uri);
  updated = setEnvValue(updated, 'DB_SSL', 'true');
  fs.writeFileSync(ENV_PATH, updated);

  ok('DATABASE_URL written');
  ok('DB_SSL set to true');
  say(`${c.dim}    backup: ${path.basename(backupPath)}${c.reset}`);

  if (info.publicTables > 0) {
    warn(`The public schema already holds ${info.publicTables} table(s).`);
    const proceed = (await ask('Run the migrations anyway? [y/N] ')).trim().toLowerCase();
    if (proceed !== 'y') {
      say('\nStopping here. Run `npm run db:migrate` yourself when ready.');
      rl.close();
      return;
    }
  }

  heading('Creating the schema');
  if (!run('npx', ['sequelize', 'db:migrate'])) {
    fail('Migrations failed. See the output above.');
    rl.close();
    process.exitCode = 1;
    return;
  }
  ok('Migrations applied');

  const wantSeed = (
    await ask('\nSeed the starter data (admin user, categories, 8 products, settings)? [Y/n] ')
  )
    .trim()
    .toLowerCase();

  if (wantSeed !== 'n') {
    heading('Seeding');
    if (run('npx', ['sequelize', 'db:seed:all'])) {
      ok('Seed data inserted');
    } else {
      warn('Seeding failed. The schema is in place, so retry with `npm run db:seed`.');
    }
  }

  heading('Done');
  say('Start the API and check it:');
  say(`  ${c.cyan}npm run dev${c.reset}`);
  say(`  ${c.cyan}curl http://localhost:5000/api/v1/health${c.reset}`);
  say();
  say(`In Supabase your tables live under the ${c.bold}public${c.reset} schema, not ${c.dim}auth${c.reset}.`);
  say('Table Editor -> schema dropdown (top left) -> switch from "auth" to "public".');

  rl.close();
};

main().catch((error) => {
  fail(error.message);
  rl.close();
  process.exitCode = 1;
});
