// Enforces one plugin = one skill, the plugin directory layout, SKILL.md
// frontmatter rules, cross-file name equality, and exact catalog coverage.
import fs from 'node:fs';
import path from 'node:path';
import {
  MARKETPLACE_NAME,
  NPM_SCOPE,
  listPluginNames,
  pluginPath,
  pluginsDir,
  readJson,
  readSkillFrontmatter,
  relativeToRepo,
  repoRoot,
  skillFilePath,
} from './lib/repo.mjs';

const PORTABLE_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const ALLOWED_PLUGIN_ENTRIES = ['package.json', 'plugin.json', '.claude-plugin', 'skills', 'README.md', 'LICENSE', 'CHANGELOG.md'];
const REQUIRED_PLUGIN_ENTRIES = ['package.json', 'plugin.json', '.claude-plugin/plugin.json', 'skills', 'README.md', 'LICENSE'];
const ALLOWED_FRONTMATTER_KEYS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CLAUDE_CATALOG = path.join(repoRoot, '.claude-plugin', 'marketplace.json');
const CODEX_CATALOG = path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');

const errors = [];

function report(file, message) {
  errors.push(`${relativeToRepo(file)}: ${message}`);
}

function checkPluginDirectory(name) {
  const dir = pluginPath(name);
  if (!fs.statSync(dir).isDirectory()) {
    report(dir, 'plugins/ may only contain plugin directories');
    return false;
  }

  for (const entry of fs.readdirSync(dir)) {
    if (!ALLOWED_PLUGIN_ENTRIES.includes(entry)) {
      report(path.join(dir, entry), `unexpected entry; plugin roots may only contain ${ALLOWED_PLUGIN_ENTRIES.join(', ')} (Codex copies the whole plugin directory)`);
    }
  }
  const missing = REQUIRED_PLUGIN_ENTRIES.filter((entry) => !fs.existsSync(path.join(dir, entry)));
  for (const entry of missing) {
    report(path.join(dir, entry), 'required plugin file is missing');
  }
  if (missing.length > 0) {
    return false;
  }

  const claudeEntries = fs.readdirSync(pluginPath(name, '.claude-plugin'));
  if (claudeEntries.length !== 1) {
    report(pluginPath(name, '.claude-plugin'), `must contain only plugin.json, found: ${claudeEntries.join(', ')}`);
  }

  const skillsDir = pluginPath(name, 'skills');
  const skillEntries = fs.readdirSync(skillsDir);
  if (skillEntries.length !== 1) {
    report(skillsDir, `must contain exactly one skill directory, found: ${skillEntries.join(', ') || 'nothing'}`);
    return false;
  }
  const skillDir = path.join(skillsDir, skillEntries[0]);
  if (!fs.statSync(skillDir).isDirectory()) {
    report(skillDir, 'must be a skill directory (Pi loads loose files in skills/ as extra skills)');
    return false;
  }
  if (skillEntries[0] !== name) {
    report(skillDir, `skill directory name must equal the plugin directory name "${name}"`);
    return false;
  }
  if (!fs.existsSync(skillFilePath(name))) {
    report(skillFilePath(name), 'SKILL.md is missing');
    return false;
  }
  return true;
}

function checkFrontmatter(name) {
  const file = skillFilePath(name);
  const frontmatter = readSkillFrontmatter(file);

  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_FRONTMATTER_KEYS.includes(key)) {
      report(file, `frontmatter key "${key}" is not allowed; Agent Skills allows only ${ALLOWED_FRONTMATTER_KEYS.join(', ')}`);
    }
  }

  const skillName = frontmatter.name;
  if (typeof skillName !== 'string' || !SKILL_NAME_PATTERN.test(skillName) || skillName.length > 64) {
    report(file, 'frontmatter name must be lowercase letters, digits, and single hyphens, at most 64 characters');
  } else if (skillName !== name) {
    report(file, `frontmatter name "${skillName}" must equal its directory name "${name}"`);
  }

  const description = frontmatter.description;
  if (typeof description !== 'string' || description.trim() === '' || description.length > 1024) {
    report(file, 'frontmatter description must be a non-empty string of at most 1024 characters');
  }

  const compatibility = frontmatter.compatibility;
  if (compatibility !== undefined && (typeof compatibility !== 'string' || compatibility.length > 500)) {
    report(file, 'frontmatter compatibility must be a string of at most 500 characters');
  }
}

function checkManifests(name) {
  const packageFile = pluginPath(name, 'package.json');
  const portableFile = pluginPath(name, 'plugin.json');
  const claudeFile = pluginPath(name, '.claude-plugin', 'plugin.json');

  const packageName = readJson(packageFile).name;
  if (packageName !== `${NPM_SCOPE}/${name}`) {
    report(packageFile, `name "${packageName}" must be "${NPM_SCOPE}/${name}"`);
  }

  const portable = readJson(portableFile);
  if (portable.$schema !== PORTABLE_SCHEMA) {
    report(portableFile, `$schema must be exactly "${PORTABLE_SCHEMA}" (Codex silently falls back to .claude-plugin/plugin.json otherwise)`);
  }
  if (portable.name !== name) {
    report(portableFile, `name "${portable.name}" must equal the plugin directory name "${name}"`);
  }

  const claudeName = readJson(claudeFile).name;
  if (claudeName !== name) {
    report(claudeFile, `name "${claudeName}" must equal the plugin directory name "${name}"`);
  }
}

function checkCatalogEntries(file, pluginNames, checkEntry) {
  const catalog = readJson(file);
  if (catalog.name !== MARKETPLACE_NAME) {
    report(file, `marketplace name "${catalog.name}" must be "${MARKETPLACE_NAME}"`);
  }
  if (!Array.isArray(catalog.plugins)) {
    report(file, 'plugins must be an array');
    return;
  }

  const entryNames = catalog.plugins.map((entry) => entry.name);
  for (const name of pluginNames) {
    const count = entryNames.filter((entryName) => entryName === name).length;
    if (count !== 1) {
      report(file, `plugin "${name}" must be listed exactly once, found ${count}`);
    }
  }
  for (const entry of catalog.plugins) {
    if (!pluginNames.includes(entry.name)) {
      report(file, `entry "${entry.name}" does not match any directory under plugins/`);
      continue;
    }
    checkEntry(entry);
  }
}

function checkClaudeEntry(entry) {
  const expectedSource = `./plugins/${entry.name}`;
  if (entry.source !== expectedSource) {
    report(CLAUDE_CATALOG, `entry "${entry.name}" source must be exactly "${expectedSource}"`);
  }
  if ('version' in entry) {
    report(CLAUDE_CATALOG, `entry "${entry.name}" must not declare a version (the plugin manifest owns it)`);
  }
}

function checkCodexEntry(entry) {
  const expectedPath = `./plugins/${entry.name}`;
  const source = entry.source;
  const isExact = typeof source === 'object'
    && source !== null
    && Object.keys(source).length === 2
    && source.source === 'local'
    && source.path === expectedPath;
  if (!isExact) {
    report(CODEX_CATALOG, `entry "${entry.name}" source must be exactly {"source":"local","path":"${expectedPath}"}`);
  }
}

const pluginNames = listPluginNames();
if (pluginNames.length === 0) {
  report(pluginsDir, 'no plugin directories found');
}
for (const name of pluginNames) {
  if (!checkPluginDirectory(name)) {
    continue;
  }
  checkFrontmatter(name);
  checkManifests(name);
}
checkCatalogEntries(CLAUDE_CATALOG, pluginNames, checkClaudeEntry);
checkCatalogEntries(CODEX_CATALOG, pluginNames, checkCodexEntry);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`✘ ${error}`);
  }
  console.error(`✘ layout check failed with ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`✔ ${pluginNames.length} plugins, one skill each, names consistent: ${pluginNames.join(', ')}`);
console.log(`✔ Claude and Codex catalogs "${MARKETPLACE_NAME}" each list every plugin exactly once`);
