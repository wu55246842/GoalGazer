#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';

const args = process.argv.slice(2);
const pythonScript = resolve(__dirname, '../python/goalgazer/__main__.py');

console.log('🚀 GoalGazer Pipeline Runner');
console.log('================================\n');

const pythonProcess = spawn('python', [pythonScript, ...args], {
  stdio: 'inherit',
  cwd: resolve(__dirname, '../python'),
});

pythonProcess.on('error', (error) => {
  console.error('❌ Failed to start Python process:', error.message);
  process.exit(1);
});

pythonProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Pipeline completed successfully');
  } else {
    console.error(`\n❌ Pipeline failed with exit code ${code}`);
    process.exit(code || 1);
  }
});
