import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

dotenv.config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  override: false
});

const globalForPrisma = globalThis;
const baseConnectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!baseConnectionString) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL in server environment');
}

const withSupabaseDefaults = (input) => {
  try {
    const url = new URL(input);
    const isSupabase = url.hostname.includes('supabase.co') || url.hostname.includes('supabase.com');

    if (!isSupabase) {
      return input;
    }

    if (url.hostname.includes('pooler.supabase.com') && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }

    // Keep SSL enabled while matching libpq semantics in pg v8/v9 transition.
    // Without this, `sslmode=require` is treated like `verify-full` in current pg,
    // which can surface "self-signed certificate in certificate chain" for some setups.
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    if (url.searchParams.get('sslmode') === 'require' && !url.searchParams.has('uselibpqcompat')) {
      url.searchParams.set('uselibpqcompat', 'true');
    }

    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', String(Number(process.env.PG_CONNECT_TIMEOUT_SEC) || 15));
    }

    return url.toString();
  } catch {
    return input;
  }
};

const connectionString = withSupabaseDefaults(baseConnectionString);

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 10000,
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS) || 15000,
  keepAlive: true
});

pool.on('error', (error) => {
  // Prevent unhandled pg pool errors from crashing the process during transient DB outages.
  console.error('[DB Pool Error]', error?.message || error);
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
