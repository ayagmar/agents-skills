// Requires each workspace tarball (npm pack --dry-run) to contain exactly the
// manifests, README, LICENSE, and skill files, with no sensitive files or user paths.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { listPluginNames, pluginPath, readJson, repoRoot } from './lib/repo.mjs';

const FIXED_FILES = ['package.json', 'plugin.json', '.claude-plugin/plugin.json', 'README.md', 'LICENSE'];
const SENSITIVE_PATTERNS = [
  /(^|\/)\.env[^/]*$/,
  /\.(jsonl|ndjson)(\.gz)?$/,
  /\.log$/,
  /\.map$/,
  /(^|\/)\.npmrc$/,
  /\.pem$/,
  /\.key$/,
  /(^|\/)id_(rsa|ed25519|ecdsa|dsa)[^/]*$/,
  /(^|\/)\.?credentials?[^/]*$/i,
  /(^|\/)auth\.json$/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)node_modules\//,
  /(^|\/)(\.cache|__pycache__)\//,
];
const USER_PATH_PATTERNS = [/\/home\/[\w.-]+/, /\/Users\/[\w.-]+/, /C:\\Users\\/i];

function expectedFiles(name) {
  const skillDir = pluginPath(name, 'skills', name);
  const skillFiles = fs.readdirSync(skillDir, { recursive: true, withFileTypes: true })
    .filter((entry) => !entry.isDirectory())
    .map((entry) => path.relative(pluginPath(name), path.join(entry.parentPath, entry.name)));
  return [...FIXED_FILES, ...skillFiles].sort();
}

function packedFiles(name) {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--workspace', `plugins/${name}`], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return JSON.parse(output)[0].files.map((file) => file.path).sort();
}

const errors = [];
const summaries = [];

for (const name of listPluginNames()) {
  const packageName = readJson(pluginPath(name, 'package.json')).name;
  const expected = expectedFiles(name);
  const packed = packedFiles(name);

  for (const file of expected) {
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(file))) {
      errors.push(`${packageName}: ${file} matches a sensitive file pattern and must not ship`);
    }
  }
  for (const file of expected.filter((file) => !packed.includes(file))) {
    errors.push(`${packageName}: ${file} is on disk but missing from the tarball (check "files" in package.json; npm pack drops symlinks)`);
  }
  for (const file of packed.filter((file) => !expected.includes(file))) {
    errors.push(`${packageName}: ${file} is in the tarball but not expected`);
  }

  for (const file of packed) {
    const content = fs.readFileSync(pluginPath(name, file));
    // Binary files contain NUL bytes; only scan text files for user paths.
    if (content.includes(0)) {
      continue;
    }
    const text = content.toString('utf8');
    if (USER_PATH_PATTERNS.some((pattern) => pattern.test(text))) {
      errors.push(`${packageName}: ${file} contains an absolute user path (/home/<user>, /Users/<user>, or C:\\Users\\)`);
    }
  }

  summaries.push(`${packageName}: ${packed.length} files, tarball matches the expected set`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`✘ ${error}`);
  }
  console.error(`✘ package contents check failed with ${errors.length} error(s)`);
  process.exit(1);
}

for (const summary of summaries) {
  console.log(`✔ ${summary}`);
}
