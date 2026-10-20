import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, 'waitlist.db');
const OUTPUT_PATH = process.env.OUTPUT_PATH || (
  // Use /tmp in production (writable), local directory in development
  process.env.NODE_ENV === 'production' ? '/tmp/waitlist-export.csv' : join(__dirname, 'waitlist-export.csv')
);

const db = new Database(DB_PATH, { readonly: true });

try {
  const rows = db.prepare(`
    SELECT 
      id,
      email,
      role,
      organisation,
      consent_at,
      created_at
    FROM waitlist 
    ORDER BY created_at DESC
  `).all();
  
  if (rows.length === 0) {
    console.log('No signups to export.');
    process.exit(0);
  }
  
  const headers = ['id', 'email', 'role', 'organisation', 'consent_at', 'created_at'];
  
  function escapeCsvField(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => escapeCsvField(row[header])).join(',')
    )
  ];
  
  const csv = csvLines.join('\n');
  
  writeFileSync(OUTPUT_PATH, csv, 'utf8');
  
  console.log(`Exported ${rows.length} signups to ${OUTPUT_PATH}`);
  console.log(`Total signups: ${rows.length}`);
  
  const roleCounts = rows.reduce((acc, row) => {
    acc[row.role] = (acc[row.role] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nBreakdown by role:');
  Object.entries(roleCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
  
} catch (error) {
  console.error('Export failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
