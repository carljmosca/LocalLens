/* sqliteService: in-browser read-only SQLite DB using sql.js (with CDN fallback)
   - Dynamically loads sql.js (tries local package, falls back to CDN)
   - Loads a pre-populated SQLite database file (pois.db)
   - Exposes runQuery(sql) for read-only execution
*/
import { logger } from '../utils/logger';

class SqliteService {
  private db: any = null;
  private initialized = false;

  async init(): Promise<void> {
    // If already initialized, return early
    if (this.initialized) {
      logger.log('🗂️ [DEBUG] SQLite already initialized');
      return;
    }

    try {
      // Load sql.js library
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
      
      // Load pre-populated SQLite database file
      const dbUrl = `${import.meta.env.BASE_URL}pois.db`;
      logger.log('🗂️ [DEBUG] Loading SQLite database from:', dbUrl);

      const dbResp = await fetch(dbUrl);
      if (!dbResp.ok) throw new Error(`Failed to fetch SQLite database: ${dbUrl}. Run 'node scripts/generate-db.js' to create it.`);
      
      const dbBuffer = await dbResp.arrayBuffer();
      this.db = new SQL.Database(new Uint8Array(dbBuffer));

      this.initialized = true;
      logger.log('✅ [DEBUG] SQLite database loaded and ready');
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
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }

  runQuery(sql: string): { columns: string[]; values: any[][] }[] {
    if (!this.db) throw new Error('DB not initialized');
    const res = this.db.exec(sql);
    return res.map((r: any) => ({ columns: r.columns, values: r.values }));
  }
}

export const sqliteService = new SqliteService();
