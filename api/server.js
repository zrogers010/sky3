import express from 'express';
import { rateLimit } from 'express-rate-limit';
import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, 'waitlist.db');

// Trust proxy for rate limiting behind ALB + nginx (2 hops)
app.set('trust proxy', 2);

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('contributor', 'ai_developer', 'researcher')),
    organisation TEXT,
    consent_at TEXT NOT NULL,
    source TEXT,
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_email ON waitlist(email);
  CREATE INDEX IF NOT EXISTS idx_created_at ON waitlist(created_at);
`);

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return createHash('sha256').update(ip + 'sky3-waitlist').digest('hex');
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }
});

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function hashIp(ip) {
  return createHash('sha256').update(ip + 'sky3').digest('hex');
}

app.post('/api/waitlist', limiter, (req, res) => {
  try {
    const { email, role, organisation, consent, company_url } = req.body;
    
    if (company_url) {
      return res.json({ success: true });
    }
    
    const errors = {};
    
    if (!email || !validateEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    const validRoles = ['contributor', 'ai_developer', 'researcher'];
    if (!role || !validRoles.includes(role)) {
      errors.role = 'Please select a valid role.';
    }
    
    if (!consent) {
      errors.consent = 'You must consent to receive emails.';
    }
    
    if (organisation && organisation.length > 120) {
      errors.organisation = 'Organisation name must be 120 characters or less.';
    }
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const ipHash = hashIp(ip);
    const consentAt = new Date().toISOString();
    const source = null;
    
    try {
      const existing = db.prepare('SELECT id FROM waitlist WHERE email = ?').get(normalizedEmail);
      
      if (existing) {
        db.prepare(`
          UPDATE waitlist 
          SET role = ?, organisation = ?, consent_at = ?, ip_hash = ?
          WHERE email = ?
        `).run(role, organisation || null, consentAt, ipHash, normalizedEmail);
      } else {
        db.prepare(`
          INSERT INTO waitlist (email, role, organisation, consent_at, source, ip_hash, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(normalizedEmail, role, organisation || null, consentAt, source, ipHash, consentAt);
      }
      
      res.json({ success: true });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({
        success: false,
        error: 'Failed to save your information. Please try again.'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    });
  }
});

app.get('/api/waitlist/health', (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM waitlist').get();
    res.json({ 
      status: 'ok', 
      signups: count.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sky3 Waitlist API running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Endpoints:`);
  console.log(`  POST /api/waitlist - Submit waitlist signup`);
  console.log(`  GET  /api/waitlist/health - Health check`);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
