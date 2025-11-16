#!/usr/bin/env node
/**
 * Generate pois.db SQLite database from pois.json
 * This script is run during the build process to create the database file
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const schemaFile = path.join(rootDir, 'schema.sql');
const poisJsonFile = path.join(publicDir, 'pois.json');
const dbFile = path.join(publicDir, 'pois.db');

console.log('🗂️  Generating SQLite database from pois.json...\n');

// Check if sqlite3 is available
try {
  execSync('sqlite3 --version', { stdio: 'ignore' });
} catch (err) {
  console.error('❌ Error: sqlite3 is not installed or not in PATH');
  console.error('   Please install SQLite: https://www.sqlite.org/download.html');
  process.exit(1);
}

// Remove old database if it exists
if (fs.existsSync(dbFile)) {
  console.log('🗑️  Removing old database...');
  fs.unlinkSync(dbFile);
}

// Create database with schema
console.log('📋 Creating database schema...');
execSync(`sqlite3 "${dbFile}" < "${schemaFile}"`, { stdio: 'inherit' });

// Load and parse JSON
console.log('📖 Reading pois.json...');
const data = JSON.parse(fs.readFileSync(poisJsonFile, 'utf8'));
const pois = data.pois || [];

console.log(`📊 Found ${pois.length} POIs to insert\n`);

// Generate SQL script
const sqlStatements = [];

// Collect unique types and attributes
const types = new Set();
const attrs = new Set();
pois.forEach(p => {
  if (p.type) types.add(p.type);
  if (p.attributes) p.attributes.forEach(a => attrs.add(a));
});

// Insert types
console.log(`   Inserting ${types.size} POI types...`);
types.forEach(type => {
  sqlStatements.push(`INSERT INTO poi_types (type_name) VALUES ('${type.replace(/'/g, "''")}');`);
});

// Insert attributes
console.log(`   Inserting ${attrs.size} attributes...`);
attrs.forEach(attr => {
  sqlStatements.push(`INSERT INTO attributes (attribute_name) VALUES ('${attr.replace(/'/g, "''")}');`);
});

// Insert POIs
console.log(`   Inserting ${pois.length} POIs...`);
pois.forEach(p => {
  const id = p.id.replace(/'/g, "''");
  const name = p.name.replace(/'/g, "''");
  const type = p.type.replace(/'/g, "''");
  const address = (p.address || '').replace(/'/g, "''");
  const lat = p.location?.latitude ?? p.latitude ?? 'NULL';
  const lon = p.location?.longitude ?? p.longitude ?? 'NULL';
  
  sqlStatements.push(`
    INSERT INTO pois (id, name, type_id, address, latitude, longitude)
    VALUES ('${id}', '${name}', (SELECT type_id FROM poi_types WHERE type_name = '${type}'), '${address}', ${lat}, ${lon});
  `);
  
  // Insert attributes for this POI
  if (p.attributes && p.attributes.length > 0) {
    p.attributes.forEach(attr => {
      const escapedAttr = attr.replace(/'/g, "''");
      sqlStatements.push(`
        INSERT INTO poi_attributes (poi_id, attribute_id)
        VALUES ('${id}', (SELECT attribute_id FROM attributes WHERE attribute_name = '${escapedAttr}'));
      `);
    });
  }
});

// Write SQL to temp file and execute
const tempSqlFile = path.join(publicDir, 'temp-insert.sql');
fs.writeFileSync(tempSqlFile, sqlStatements.join('\n'));

console.log('💾 Executing SQL statements...');
execSync(`sqlite3 "${dbFile}" < "${tempSqlFile}"`, { stdio: 'inherit' });

// Clean up temp file
fs.unlinkSync(tempSqlFile);

// Verify database
console.log('\n✅ Database created successfully!');
const stats = fs.statSync(dbFile);
console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`   Location: ${dbFile}\n`);
