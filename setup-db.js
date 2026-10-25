const fs = require('node:fs/promises');
const { Client } = require('pg');
const config = require('./config');

async function main() {
  if (!config.databaseUrl) throw new Error('Set PG_URL or DATABASE_URL before initializing the schema.');
  const client = new Client({ connectionString: config.databaseUrl, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query(await fs.readFile(`${__dirname}/db/schema.sql`, 'utf8'));
    console.log('Linkdrop schema ready.');
  } finally {
    await client.end();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
