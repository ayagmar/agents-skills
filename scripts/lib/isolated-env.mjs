// Runs agent CLIs (claude, codex, pi, skills) inside a throwaway root so they never
// touch the real HOME, agent config, or credentials. The repository is only passed
// in as an install or validate source.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const ROOT_PREFIX = 'agents-skills-';
const PASSTHROUGH_VARS = ['PATH', 'LANG', 'LC_ALL'];
const TIMEOUT_MS = 120_000;

// Creates a fresh isolated root, passes its `{ cwd, env }` sandbox to `callback`,
// and always removes the root afterwards.
export async function withIsolatedRoot(callback) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), ROOT_PREFIX));
  try {
    const sandbox = await createSandbox(root);
    return await callback(sandbox);
  } finally {
    // fs.rm does not follow symlinks, so nothing outside the root is touched.
    await fs.rm(root, { recursive: true, force: true });
  }
}

// Spawns `binary` with the sandbox env and cwd; output is captured unless `options.stdio` says otherwise.
export function runIsolated(sandbox, binary, args, options = {}) {
  return spawnSync(binary, args, {
    cwd: sandbox.cwd,
    env: sandbox.env,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    ...options,
  });
}

async function createSandbox(root) {
  const dirs = {
    HOME: path.join(root, 'home'),
    XDG_CONFIG_HOME: path.join(root, 'xdg', 'config'),
    XDG_DATA_HOME: path.join(root, 'xdg', 'data'),
    XDG_STATE_HOME: path.join(root, 'xdg', 'state'),
    XDG_CACHE_HOME: path.join(root, 'xdg', 'cache'),
    TMPDIR: path.join(root, 'tmp'),
    CLAUDE_CONFIG_DIR: path.join(root, 'claude'),
    CODEX_HOME: path.join(root, 'codex'),
    PI_CODING_AGENT_DIR: path.join(root, 'pi-agent'),
    npm_config_cache: path.join(root, 'npm-cache'),
  };
  const cwd = path.join(root, 'project');
  for (const dir of [...Object.values(dirs), cwd]) {
    await fs.mkdir(dir, { recursive: true });
  }

  const env = {
    ...dirs,
    DISABLE_TELEMETRY: '1',
    DO_NOT_TRACK: '1',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    PI_OFFLINE: '1',
    PI_SKIP_VERSION_CHECK: '1',
    PI_TELEMETRY: '0',
  };
  for (const name of PASSTHROUGH_VARS) {
    if (process.env[name] !== undefined) {
      env[name] = process.env[name];
    }
  }
  return { cwd, env };
}
