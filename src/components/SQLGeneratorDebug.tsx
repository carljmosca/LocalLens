import React, { useState } from 'react';
import { lmService } from '../services/lmService';
import { logger } from '../utils/logger';
import { sqliteService } from '../services/sqliteService';

export const SQLGeneratorDebug: React.FC = () => {
  const [nlQuery, setNlQuery] = useState('Find museums with nearby French restaurants');
  const [sql, setSql] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setSql(null);
    try {
      // Use hardcoded schema for debugging
      const schemaText = `CREATE TABLE poi_types (type_id INTEGER PRIMARY KEY AUTOINCREMENT, type_name TEXT NOT NULL UNIQUE);
CREATE TABLE pois (id TEXT PRIMARY KEY, name TEXT NOT NULL, type_id INTEGER, address TEXT, latitude REAL, longitude REAL, FOREIGN KEY (type_id) REFERENCES poi_types(type_id));
CREATE TABLE attributes (attribute_id INTEGER PRIMARY KEY AUTOINCREMENT, attribute_name TEXT NOT NULL UNIQUE);
CREATE TABLE poi_attributes (poi_id TEXT, attribute_id INTEGER, PRIMARY KEY (poi_id, attribute_id), FOREIGN KEY (poi_id) REFERENCES pois(id), FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id));`;

      // Ensure LM is initialized
      try {
        await lmService.initialize();
      } catch (initErr) {
        // Initialization may already be done elsewhere; log and continue
        logger.error('LM init error (SQL debug):', initErr);
      }

      const generated = await lmService.generateSQL(nlQuery, schemaText);
      setSql(generated);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const execute = async () => {
    if (!sql) return;
    setError(null);
    setLoading(true);
    try {
      await sqliteService.init();
      const results = sqliteService.runQuery(sql);
      if (results.length === 0) {
        setSql(prev => prev + '\n-- (No rows returned)');
      } else {
        // show first result table under SQL
        const r = results[0];
        const rows = r.values.map((v: any[]) => Object.fromEntries(r.columns.map((c: string, i: number) => [c, v[i]])));
        setSql(prev => prev + '\n\n-- Results (first table)\n' + JSON.stringify(rows, null, 2));
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 10, fontSize: 12 }}>
      <div style={{ marginBottom: 6 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Natural language request</label>
        <textarea
          value={nlQuery}
          onChange={e => setNlQuery(e.target.value)}
          rows={3}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={run} disabled={loading} style={{ padding: '4px 8px' }}>
          {loading ? 'Running…' : 'Generate SQL'}
        </button>
        <button onClick={execute} disabled={loading || !sql} style={{ padding: '4px 8px' }}>
          Execute Read-Only
        </button>
        <button onClick={() => { setNlQuery('Find museums with nearby French restaurants'); setSql(null); setError(null); }} style={{ padding: '4px 8px' }}>
          Reset Example
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, color: '#f55', fontFamily: 'monospace' }}>Error: {error}</div>
      )}

      {sql && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>Generated SQL:</div>
          <pre style={{ background: '#111', color: '#0f0', padding: 8, overflowX: 'auto', fontSize: 12 }}>{sql}</pre>
        </div>
      )}
    </div>
  );
};

export default SQLGeneratorDebug;
