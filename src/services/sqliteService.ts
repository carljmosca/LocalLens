/* sqliteService: in-browser read-only SQLite DB using sql.js (with CDN fallback)
   - Dynamically loads sql.js (tries local package, falls back to CDN)
   - Initializes a DB with schema from /schema.sql
   - Populates POIs from a provided JSON data source
   - Exposes runQuery(sql) for read-only execution
*/
import { logger } from '../utils/logger';
import { dataService } from './dataService';

type SQLJSStatic = any;

class SqliteService {
  private SQL: SQLJSStatic | null = null;
  private db: any = null;
  private initialized = false;

  async init(dataSourcePath?: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Prefer a globally-provided initSqlJs (e.g. loaded by a script tag).
      // Avoid importing 'sql.js' directly so Vite doesn't try to resolve it during build.
      // If not available, dynamically load the CDN script which exposes initSqlJs on window.
      // @ts-ignore
      let initSqlJs: any = (window as any).initSqlJs || null;
      if (!initSqlJs) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
        // @ts-ignore
        initSqlJs = (window as any).initSqlJs;
        if (!initSqlJs) throw new Error('initSqlJs not found on window after loading CDN script');
      }

      // Initialize with locateFile pointing to CDN wasm
      const SQL = await initSqlJs({ locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
      this.SQL = SQL;
      this.db = new SQL.Database();

      // Load schema
      const schemaResp = await fetch('/schema.sql');
      if (!schemaResp.ok) throw new Error('Failed to fetch schema.sql');
      const schemaText = await schemaResp.text();
      this.db.run(schemaText);

      // Populate POIs
      const source = dataSourcePath || localStorage.getItem('locallens-data-source') || dataService.getCurrentDataSource();
      const poisUrl = `${import.meta.env.BASE_URL}${source}`;
      logger.log('🗂️ [DEBUG] Loading POI JSON into in-browser SQLite:', poisUrl);

      const poisResp = await fetch(poisUrl);
      if (!poisResp.ok) throw new Error(`Failed to fetch POI JSON: ${poisUrl}`);
      const data = await poisResp.json();
      await this.populateFromPoisJson(data);

      this.initialized = true;
      logger.log('✅ [DEBUG] In-browser SQLite DB initialized and populated');
    } catch (error) {
      logger.error('sqliteService.init error:', error);
      throw error;
    }
  }

  private async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }

  private async populateFromPoisJson(json: any) {
    if (!this.db) throw new Error('DB not initialized');

    const pois: any[] = json.pois || [];
    const types = new Map<string, number>();
    const attrs = new Map<string, number>();

    // Insert types
    const insertType = this.db.prepare('INSERT INTO poi_types (type_name) VALUES (?);');
    for (const p of pois) {
      const t = (p.type || '').toString();
      if (!types.has(t)) {
        insertType.run([t]);
        // get last insert id
        const row = this.db.exec('SELECT last_insert_rowid() AS id');
        const id = row && row[0] && row[0].values && row[0].values[0] ? row[0].values[0][0] : null;
        types.set(t, id);
      }
    }
    insertType.free && insertType.free();

    // Insert attributes
    const insertAttr = this.db.prepare('INSERT INTO attributes (attribute_name) VALUES (?);');
    for (const p of pois) {
      const aList: string[] = p.attributes || [];
      for (const a of aList) {
        if (!attrs.has(a)) {
          insertAttr.run([a]);
          const row = this.db.exec('SELECT last_insert_rowid() AS id');
          const id = row && row[0] && row[0].values && row[0].values[0] ? row[0].values[0][0] : null;
          attrs.set(a, id);
        }
      }
    }
    insertAttr.free && insertAttr.free();

    // Insert pois
    const insertPoi = this.db.prepare('INSERT INTO pois (id, name, type_id, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?);');
    const insertPoiAttr = this.db.prepare('INSERT INTO poi_attributes (poi_id, attribute_id) VALUES (?, ?);');

    for (const p of pois) {
      const typeId = types.get(p.type) || null;
      // Handle address as simple string (not object)
      const addressStr = p.address || '';
      const lat = p.location?.latitude ?? p.latitude ?? null;
      const lon = p.location?.longitude ?? p.longitude ?? null;

      insertPoi.run([p.id, p.name, typeId, addressStr, lat, lon]);

      const aList: string[] = p.attributes || [];
      for (const a of aList) {
        const aid = attrs.get(a);
        if (aid) insertPoiAttr.run([p.id, aid]);
      }
    }

    insertPoi.free && insertPoi.free();
    insertPoiAttr.free && insertPoiAttr.free();
  }

  runQuery(sql: string): { columns: string[]; values: any[][] }[] {
    if (!this.db) throw new Error('DB not initialized');
    const res = this.db.exec(sql);
    return res.map((r: any) => ({ columns: r.columns, values: r.values }));
  }
}

export const sqliteService = new SqliteService();
