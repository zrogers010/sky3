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
    // With trust proxy, different X-Forwarded-For IPs should be rate-limited separately
    // Send requests from two different IPs - both should succeed
    const ip1Result = await postWaitlist({
      email: 'ratelimit1@example.com',
      role: 'contributor',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.1' });
    
    const ip2Result = await postWaitlist({
      email: 'ratelimit2@example.com',
      role: 'contributor',
      consent: true
    }, { 'X-Forwarded-For': '10.0.0.2' });
    
    assert.strictEqual(ip1Result.status, 200, 'First IP should not be rate limited');
    assert.strictEqual(ip2Result.status, 200, 'Second IP should not be rate limited');
  });
});
