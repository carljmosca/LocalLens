import fs from 'fs';
import path from 'path';
import { lmService } from '../src/services/lmService';

async function main() {
  const schemaPath = path.resolve(__dirname, '../schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.sql not found at', schemaPath);
    process.exit(1);
  }

  const schemaText = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Initializing LM... (this may fail in Node if WebGPU/Browser APIs are required)');
    await lmService.initialize();

    const nlQuery = 'Find museums with nearby French restaurants';
    console.log('Generating SQL for:', nlQuery);

    const sql = await lmService.generateSQL(nlQuery, schemaText);
    console.log('\n===== Generated SQL =====\n');
    console.log(sql);
    console.log('\n=========================' );
  } catch (err: any) {
    console.error('Error during SQL generation:', err?.message ?? err);
    console.error(err);
    process.exit(2);
  }
}

main();
