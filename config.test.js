const test = require('node:test');
const assert = require('node:assert/strict');

function configWith(env) {
  const keys = ['HOST', 'PORT', 'DATABASE_URL', 'PG_URL'];
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  Object.assign(process.env, env);
  delete require.cache[require.resolve('./config')];
  try { return require('./config'); }
  finally { for (const k of keys) saved[k] === undefined ? delete process.env[k] : process.env[k] = saved[k]; }
}

test('uses the database variable documented in .env.example', () => {
  const url = 'postgresql://test:placeholder@localhost:5432/linkdrop';
  assert.equal(configWith({PG_URL:url}).databaseUrl, url);
});
test('also accepts DATABASE_URL and prefers it when both are supplied', () => {
  assert.equal(configWith({PG_URL:'legacy',DATABASE_URL:'platform'}).databaseUrl, 'platform');
});
test('honours a deployment-provided port', () => {
  assert.equal(configWith({PORT:'34567'}).port, 34567);
});
test('default port matches documented local URL', () => {
  assert.equal(configWith({}).port, 3000);
});
test('default bind allows the reverse proxy to reach the container', () => {
  assert.equal(configWith({}).host, '0.0.0.0');
});
test('allows an explicit local-only host override', () => {
  assert.equal(configWith({HOST:'127.0.0.1'}).host, '127.0.0.1');
});
