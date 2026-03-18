#!/usr/bin/env node
/**
 * Validates that functions directory and project config are congruent.
 * Run from repo root: node scripts/check-config.mjs
 */
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const functionsDir = join(root, 'functions');
const apiDir = join(root, 'functions', 'api');

// Project config slugs and API path prefixes (from projects.config.ts)
const PROJECTS = [
  { slug: 'modeling', apiPathPrefix: '/api/modeling' },
  { slug: 'notion-sync', apiPathPrefix: '/api/notion-sync' },
  { slug: 'partner-portal', apiPathPrefix: '/api/partner' }, // proxied by Hub, no functions/api/partner-portal
];

const HUB_PROXIED_API_PREFIXES = ['/api/partner'];

function hasPathCatchAll(dir) {
  try {
    const names = readdirSync(dir);
    return names.some((n) => n === '[[path]].ts' || n.startsWith('[[path]]'));
  } catch {
    return false;
  }
}

let failed = false;

// 1. Every project must have functions/{slug}/ with a [[path]] handler
for (const { slug } of PROJECTS) {
  const frontendDir = join(functionsDir, slug);
  const hasHandler = existsSync(frontendDir) && hasPathCatchAll(frontendDir);
  if (!hasHandler) {
    console.error(`Missing: functions/${slug}/[[path]].ts (frontend proxy)`);
    failed = true;
  }
}

// 2. API: either functions/api/{slug}/ exists or path is hub-proxied
for (const { slug, apiPathPrefix } of PROJECTS) {
  const isHubProxied = HUB_PROXIED_API_PREFIXES.includes(apiPathPrefix);
  const apiSlugDir = join(apiDir, slug);
  const hasApiHandler = existsSync(apiSlugDir) && hasPathCatchAll(apiSlugDir);
  if (!isHubProxied && !hasApiHandler) {
    console.error(`Missing: functions/api/${slug}/[[path]].ts (API proxy for ${apiPathPrefix})`);
    failed = true;
  }
  if (isHubProxied && hasApiHandler) {
    console.error(`Redundant: functions/api/${slug}/ exists but ${apiPathPrefix} is hub-proxied`);
    failed = true;
  }
}

// 3. Generic api proxy must exist
if (!existsSync(join(apiDir, '[[path]].ts'))) {
  console.error('Missing: functions/api/[[path]].ts (Hub API proxy)');
  failed = true;
}

if (failed) {
  process.exit(1);
}
console.log('Config check OK: functions match project config.');
