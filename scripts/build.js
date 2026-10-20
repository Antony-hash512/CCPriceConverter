import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');

function stripModuleSyntax(code) {
  let result = code;
  // Remove import declarations (including multi-line imports)
  result = result.replace(/import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]+['"];?/g, '');
  
  // Strip export declarations
  result = result.replace(/export\s+default\s+/g, '');
  result = result.replace(/export\s+(async\s+function\b)/g, '$1');
  result = result.replace(/export\s+(function\b)/g, '$1');
  result = result.replace(/export\s+(const\b)/g, '$1');
  result = result.replace(/export\s+(let\b)/g, '$1');
  result = result.replace(/export\s+(var\b)/g, '$1');
  result = result.replace(/export\s*\{[^}]*\};?/g, '');

  return result.trim();
}

console.log('--- Building CCPriceConverter Bundles ---');

// 1. Build app.bundle.js
const appFiles = ['calculator.js', 'theme.js', 'i18n.js', 'providers.js', 'app.js'];
const appChunks = appFiles.map(filename => {
  const filePath = path.join(jsDir, filename);
  const code = fs.readFileSync(filePath, 'utf8');
  return `// ==========================================================================\n// Module: ${filename}\n// ==========================================================================\n${stripModuleSyntax(code)}`;
});

const appBundleContent = `/**
 * CCPriceConverter - All-in-one standalone bundle
 * Generated automatically by scripts/build.js
 * Supports pure client-side execution (file://, static localhost, or proxy server)
 */
(() => {
  'use strict';

${appChunks.join('\n\n')}

})();
`;

// Verify syntax
try {
  new vm.Script(appBundleContent);
  const targetAppBundle = path.join(jsDir, 'app.bundle.js');
  fs.writeFileSync(targetAppBundle, appBundleContent, 'utf8');
  console.log(`✓ Built ${path.relative(rootDir, targetAppBundle)} (${appBundleContent.length} bytes)`);
} catch (err) {
  console.error('Failed to validate app.bundle.js syntax:', err);
  process.exit(1);
}

// 2. Build instructions.bundle.js
const instructionsFiles = ['theme.js', 'instructions.js'];
const instructionsChunks = instructionsFiles.map(filename => {
  const filePath = path.join(jsDir, filename);
  const code = fs.readFileSync(filePath, 'utf8');
  return `// ==========================================================================\n// Module: ${filename}\n// ==========================================================================\n${stripModuleSyntax(code)}`;
});

const instructionsBundleContent = `/**
 * CCPriceConverter - Instructions standalone bundle
 * Generated automatically by scripts/build.js
 */
(() => {
  'use strict';

${instructionsChunks.join('\n\n')}

})();
`;

// Verify syntax
try {
  new vm.Script(instructionsBundleContent);
  const targetInstructionsBundle = path.join(jsDir, 'instructions.bundle.js');
  fs.writeFileSync(targetInstructionsBundle, instructionsBundleContent, 'utf8');
  console.log(`✓ Built ${path.relative(rootDir, targetInstructionsBundle)} (${instructionsBundleContent.length} bytes)`);
} catch (err) {
  console.error('Failed to validate instructions.bundle.js syntax:', err);
  process.exit(1);
}

console.log('--- All Bundles Built & Verified Successfully! ---');
