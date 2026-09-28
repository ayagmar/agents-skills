// Shared repository facts and readers for the validation scripts.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const repoRoot = path.resolve(import.meta.dirname, '..', '..');
export const pluginsDir = path.join(repoRoot, 'plugins');
export const NPM_SCOPE = '@ayagmar';
export const MARKETPLACE_NAME = 'ayagmar-skills';

export function fail(message) {
  console.error(`✘ ${message}`);
  process.exit(1);
}

export function relativeToRepo(file) {
  return path.relative(repoRoot, file);
}

export function listPluginNames() {
  return fs.readdirSync(pluginsDir).sort();
}

export function pluginPath(name, ...parts) {
  return path.join(pluginsDir, name, ...parts);
}

export function skillFilePath(name) {
  return pluginPath(name, 'skills', name, 'SKILL.md');
}

export function readJson(file) {
  if (!fs.existsSync(file)) {
    fail(`${relativeToRepo(file)}: file is missing`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`${relativeToRepo(file)}: invalid JSON (${error.message})`);
  }
}

// Parses only the YAML frontmatter block at the top of a SKILL.md file.
export function readSkillFrontmatter(file) {
  if (!fs.existsSync(file)) {
    fail(`${relativeToRepo(file)}: file is missing`);
  }
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?(?:\n|$)/);
  if (!match) {
    fail(`${relativeToRepo(file)}: no YAML frontmatter block at the top of the file`);
  }
  let frontmatter;
  try {
    frontmatter = YAML.parse(match[1]);
  } catch (error) {
    fail(`${relativeToRepo(file)}: invalid YAML frontmatter (${error.message})`);
  }
  if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    fail(`${relativeToRepo(file)}: frontmatter must be a YAML mapping`);
  }
  return frontmatter;
}

// Absolute path of a pinned host CLI installed by `npm ci`.
export function hostBinary(name) {
  const binary = path.join(repoRoot, 'node_modules', '.bin', name);
  if (!fs.existsSync(binary)) {
    fail(`${relativeToRepo(binary)} is missing: run npm ci`);
  }
  return binary;
}
