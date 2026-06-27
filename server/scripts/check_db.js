import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  override: true
});

const redactUrl = (raw) => {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '<invalid url>';
  }
};

const withSupabaseDefaults = (input) => {
  if (!input) return input;
  try {
    const url = new URL(input);
    const isSupabase = url.hostname.includes('supabase.co') || url.hostname.includes('supabase.com');

    if (!isSupabase) return input;

    if (url.hostname.includes('pooler.supabase.com') && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }
    if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
    }
    if (url.searchParams.get('sslmode') === 'require' && !url.searchParams.has('uselibpqcompat')) {
      url.searchParams.set('uselibpqcompat', 'true');
    }
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '15');
    }

    return url.toString();
  } catch {
    return input;
  }
};

const checkConnection = async (label, rawUrl) => {
  if (!rawUrl) {
    return { label, ok: false, url: null, error: 'missing' };
  }

  const connectionString = withSupabaseDefaults(rawUrl);
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS) || 15000
  });

  try {
    await client.connect();
    const counts = await client.query(`
      select
        (select count(*)::int from "User") as users,
        (select count(*)::int from "Expense") as expenses,
        (select count(*)::int from "Loan") as loans,
        (select count(*)::int from "Setting") as settings,
        (select count(*)::int from "RecurringPayment") as recurring_payments,
        (select count(*)::int from "FinanceDiary") as finance_diaries
    `);

    return {
      label,
      ok: true,
      url: redactUrl(connectionString),
      counts: counts.rows[0]
    };
  } catch (error) {
    return {
      label,
      ok: false,
      url: redactUrl(connectionString),
      error: error?.message || String(error),
      code: error?.code
    };
  } finally {
    await client.end().catch(() => {});
  }
};

const results = [];
results.push(await checkConnection('DATABASE_URL', process.env.DATABASE_URL));
results.push(await checkConnection('DIRECT_URL', process.env.DIRECT_URL));

console.log(JSON.stringify(results, null, 2));

if (!results.some((result) => result.ok)) {
  process.exitCode = 1;
}
