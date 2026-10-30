/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runAllRegulatoryAssuranceTests } from './regulatoryTests';

console.log('===============================================================');
console.log('  APAAR SEAL - Regulatory Assurance Automated Test Runner');
console.log('  Statutory Compliance, Intake Policy & State Machine Checks');
console.log('===============================================================\n');

const tests = runAllRegulatoryAssuranceTests();
let passedCount = 0;

for (const t of tests) {
  const status = t.passed ? '✓ PASSED' : '✗ FAILED';
  console.log(`[${status}] [${t.id}] ${t.name} (${t.durationMs.toFixed(2)}ms)`);
  console.log(`         Assertion: ${t.assertionDetails}`);
  if (t.error) {
    console.log(`         Error: ${t.error}`);
  }
  if (t.passed) passedCount++;
}

console.log('\n---------------------------------------------------------------');
console.log(`Result: ${passedCount}/${tests.length} tests passed.`);
console.log('---------------------------------------------------------------');

if (passedCount !== tests.length) {
  process.exit(1);
} else {
  console.log('All statutory assurance assertions verified successfully.\n');
}
