// Run one sync from your machine, against whatever DATABASE_URL points at.
//
//   node --env-file=.env.local scripts/sync.mjs          # GitHub (+ web if due)
//   node --env-file=.env.local scripts/sync.mjs --web    # force a Web Analytics copy

import { runSync } from '../lib/analytics/sync.js';

const result = await runSync({ trigger: 'script', forceWeb: process.argv.includes('--web') });
console.log(JSON.stringify(result, null, 2));
