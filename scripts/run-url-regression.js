#!/usr/bin/env node

/**
 * URL Regression Test Runner
 * Can be used locally or in CI to validate URL parsing behavior.
 * Optionally compares output across tldts versions if version info is available.
 */

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const testFile = 'test/url-regression.test.ts';

/**
 * Runs the URL regression test suite
 */
async function runTests() {
  console.log('🔍 Starting URL Regression Test Suite...\n');

  return new Promise((resolve, reject) => {
    const nodeProcess = spawn('node', ['--test', testFile], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    nodeProcess.on('close', (code) => {
      if (code === 0) {
        console.log(
          '\n✅ URL Regression Tests passed successfully\n',
        );
        resolve(true);
      } else {
        console.error(
          `\n❌ URL Regression Tests failed with exit code ${code}\n`,
        );
        reject(new Error(`Test process exited with code ${code}`));
      }
    });

    nodeProcess.on('error', (err) => {
      console.error('Error running tests:', err);
      reject(err);
    });
  });
}

/**
 * Logs environment information useful for debugging
 */
function logEnvironment() {
  console.log('📋 Environment Info:');
  console.log(`   Node: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   CWD: ${process.cwd()}\n`);
}

/**
 * Main entry point
 */
async function main() {
  logEnvironment();

  try {
    await runTests();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();