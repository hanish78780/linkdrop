const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const http = require('node:http');
const { once } = require('node:events');

// Exercise the actual server and renderer locally. Only PostgreSQL is replaced
// with a test double: these tests are not live platform/database evidence.
function loadServer(rows) {
  let server;
  const inserts = [];
  const fakeRequire = (name) => name === 'node:http'
    ? { createServer(fn) { server = http.createServer(fn); return server; } }
    : name === 'pg' ? { Pool: class { async query(sql, params) { if(sql.startsWith('INSERT')) inserts.push(params); return {rows}; } async end() {} } }
    : name === './config' ? {host:'127.0.0.1',port:0,pageSize:20,databaseUrl:'unused-test-double'}
    : require(name);
  vm.runInNewContext(fs.readFileSync(`${__dirname}/server.js`,'utf8'), { require:fakeRequire,URL,URLSearchParams,console:{log(){},error(){}},process:{on(){}} });
  return {get server(){return server;},inserts};
}
async function withServer(rows, fn) {
  const app=loadServer(rows);
  if(!app.server.listening) await once(app.server,'listening');
  try { await fn(`http://127.0.0.1:${app.server.address().port}`,app); }
  finally { app.server.closeAllConnections(); await new Promise(resolve=>app.server.close(resolve)); }
}
test('stored notes render as text, not executable HTML',async()=>withServer([{url:'https://example.org/?q="',note:'<img src=x onerror=alert(1)>',created_at:new Date('2026-10-25')}],async base=>{
  const html=await (await fetch(base)).text();
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('href="https://example.org/?q=""'));
}));
test('javascript URLs cannot be stored by directly posting to API',async()=>withServer([],async(base,app)=>{
  const response=await fetch(`${base}/links`,{method:'POST',body:new URLSearchParams({url:'javascript:alert(1)',note:'bad scheme'}),redirect:'manual'});
  assert.equal(response.status,400);
  assert.equal(app.inserts.length,0);
}));
test('ordinary HTTPS submission preserves redirect and parameterized insert',async()=>withServer([],async(base,app)=>{
  const response=await fetch(`${base}/links`,{method:'POST',body:new URLSearchParams({url:'https://example.org/article',note:"O'Reilly"}),redirect:'manual'});
  assert.equal(response.status,303);
  assert.equal(response.headers.get('location'),'/');
  assert.deepEqual(Array.from(app.inserts[0]),['https://example.org/article',"O'Reilly"]);
}));
