#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Check for node_modules in current directory and parent directory
const checkPaths = [
  'node_modules',
  path.join('..', 'node_modules')
];

const hasNodeModules = checkPaths.some(p => fs.existsSync(p));

if (!hasNodeModules) {
  console.error('\n❌ ERROR: Dependencies not installed!\n');
  console.error('Please run from project root: npm install\n');
  process.exit(1);
}

// Dependencies are installed
process.exit(0);
