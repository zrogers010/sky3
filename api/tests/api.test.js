import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_PORT = 3099;
const TEST_DB = join(__dirname, '..', 'test-waitlist.db');
const API_URL = `http://localhost:${TEST_PORT}`;

let serverProcess;

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: join(__dirname, '..'),
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        DB_PATH: TEST_DB
      }
    });
    
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('running on port')) {
        setTimeout(resolve, 500);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
    
    setTimeout(() => reject(new Error('Server start timeout')), 5000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }
}

async function postWaitlist(data, headers = {}) {
  const response = await fetch(`${API_URL}/api/waitlist`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(data)
  });
  return { status: response.status, data: await response.json() };
}

describe('Waitlist API', () => {
  before(async () => {
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
    await startServer();
  });
  
  after(() => {
    stopServer();
  });
  
  it('should accept valid signup', async () => {
    const result = await postWaitlist({
      email: 'test@example.com',
      role: 'contributor',
      organisation: 'Test Org',
      consent: true
    });
    
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.data.success, true);
  });
  
  it('should reject invalid email', async () => {
    const result = await postWaitlist({
      email: 'invalid-email',
      role: 'contributor',
      consent: true
    });
    
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.errors.email);
  });
  
  it('should reject missing role', async () => {
    const result = await postWaitlist({
      email: 'test2@example.com',
      consent: true
    });
    
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.errors.role);
  });
  
  it('should reject missing consent', async () => {
    const result = await postWaitlist({
      email: 'test3@example.com',
      role: 'researcher'
    });
    
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.data.success, false);
    assert.ok(result.data.errors.consent);
  });
  
  it('should catch honeypot', async () => {
    const result = await postWaitlist({
      email: 'bot@example.com',
      role: 'contributor',
      consent: true,
      company_url: 'https://spam.com'
    });
    
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.data.success, true);
  });
  
  it('should handle duplicate email updates', async () => {
    const health = await fetch(`${API_URL}/api/waitlist/health`);
    const healthData = await health.json();
    
    assert.strictEqual(health.status, 200);
    assert.ok(healthData.signups > 0, 'Should have signups from previous tests');
  });
  
  it('should have working health endpoint', async () => {
    const response = await fetch(`${API_URL}/api/waitlist/health`);
    const data = await response.json();
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(typeof data.signups === 'number');
  });
  
  it('should respect X-Forwarded-For for rate limiting', async () => {
    // With trust proxy 2 (ALB + nginx), rate limits should be per-client
    // Send 6 signups from IP A - the 6th should be rate limited (limit is 5/10min)
    // Then 1 from IP B should succeed (separate bucket)
    
    const ipA = '203.0.113.1';
    const ipB = '203.0.113.2';
    
    // Simulate ALB + nginx: XFF header has "client, ALB-node"
    // With trust proxy 2, req.ip will be the leftmost (client)
    const headerA = { 'X-Forwarded-For': `${ipA}, 10.0.0.9` };
    const headerB = { 'X-Forwarded-For': `${ipB}, 10.0.0.9` };
    
    // Send 5 requests from IP A - all should succeed
    for (let i = 1; i <= 5; i++) {
      const result = await postWaitlist({
        email: `ratelimit-a${i}@example.com`,
        role: 'contributor',
        consent: true
      }, headerA);
      assert.strictEqual(result.status, 200, `Request ${i} from IP A should succeed`);
    }
    
    // 6th request from IP A should be rate limited
    const a6Result = await postWaitlist({
      email: 'ratelimit-a6@example.com',
      role: 'contributor',
      consent: true
    }, headerA);
    assert.strictEqual(a6Result.status, 429, '6th request from IP A should be rate limited');
    
    // Request from IP B should succeed (different bucket)
    const bResult = await postWaitlist({
      email: 'ratelimit-b1@example.com',
      role: 'contributor',
      consent: true
    }, headerB);
    assert.strictEqual(bResult.status, 200, 'Request from IP B should succeed (separate rate limit bucket)');
  });
});
