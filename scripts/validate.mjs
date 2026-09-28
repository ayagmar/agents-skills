// Runs the full validation gate, or only the stages named on the command line
// (for example `node scripts/validate.mjs claude`). Stops at the first failure.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runIsolated, withIsolatedRoot } from './lib/isolated-env.mjs';
import { fail, hostBinary, listPluginNames, pluginPath, relativeToRepo, repoRoot } from './lib/repo.mjs';

const SCHEMA_FILE = 'schemas/agent-plugin-1.0.0.schema.json';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
  return result.status === 0;
}

function runScript(script) {
  return run(process.execPath, [script]);
}

function checkSyntax() {
  for (const name of listPluginNames()) {
    const skillsDir = pluginPath(name, 'skills');
    const scripts = fs.readdirSync(skillsDir, { recursive: true }).filter((file) => file.endsWith('.mjs'));
    for (const script of scripts) {
      const scriptPath = path.join(skillsDir, script);
      if (!run(process.execPath, ['--check', scriptPath])) {
        return false;
      }
      console.log(`✔ node --check ${relativeToRepo(scriptPath)}`);
    }
  }
  return true;
}

function checkSchema() {
  const ajv = hostBinary('ajv');
  const dataArgs = listPluginNames().flatMap((name) => ['-d', relativeToRepo(pluginPath(name, 'plugin.json'))]);
  return run(ajv, ['validate', '--spec=draft2020', '--strict=true', '-s', SCHEMA_FILE, ...dataArgs]);
}

function checkSkills() {
  const help = spawnSync('gh', ['skill', 'publish', '--help'], { stdio: 'ignore' });
  if (help.status !== 0) {
    console.error('✘ `gh skill publish` is unavailable: install GitHub CLI >= 2.90 (https://cli.github.com)');
    return false;
  }
  // Only ever --dry-run: without it gh pushes commits, adds topics, and creates a release.
  return run('gh', ['skill', 'publish', '--dry-run', '.']);
}

async function checkClaude() {
  const claude = hostBinary('claude');
  const targets = [repoRoot, ...listPluginNames().map((name) => pluginPath(name))];
  return withIsolatedRoot(async (sandbox) => {
    for (const target of targets) {
      const result = runIsolated(sandbox, claude, ['plugin', 'validate', '--strict', target], { stdio: 'inherit' });
      if (result.status !== 0) {
        return false;
      }
    }
    return true;
  });
}

const STAGES = {
  layout: () => runScript('scripts/check-layout.mjs'),
  versions: () => runScript('scripts/check-versions.mjs'),
  links: () => runScript('scripts/check-relative-links.mjs'),
  syntax: checkSyntax,
  schema: checkSchema,
  skills: checkSkills,
  claude: checkClaude,
  packages: () => runScript('scripts/check-package-contents.mjs'),
  smoke: () => runScript('scripts/smoke-install.mjs'),
};

const requested = process.argv.slice(2);
const stageNames = requested.length > 0 ? requested : Object.keys(STAGES);
for (const name of stageNames) {
  if (!(name in STAGES)) {
    fail(`unknown stage "${name}"; stages are: ${Object.keys(STAGES).join(', ')}`);
  }
}

for (const name of stageNames) {
  console.log(`\n▶ ${name}`);
  if (!(await STAGES[name]())) {
    fail(`stage ${name} failed`);
  }
  console.log(`✔ stage ${name} passed`);
}
console.log(`\n✔ ${stageNames.length} stage(s) passed: ${stageNames.join(', ')}`);
