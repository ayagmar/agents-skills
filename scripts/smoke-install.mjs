// Installs every plugin with every supported installer (skills CLI, Pi, Claude,
// Codex), each run inside its own isolated root, and asserts only that plugin
// was installed. Checks packaging and selective install, not skill behavior.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runIsolated, withIsolatedRoot } from './lib/isolated-env.mjs';
import { MARKETPLACE_NAME, hostBinary, listPluginNames, pluginPath, repoRoot } from './lib/repo.mjs';

const SKILLS_AGENT_DIRS = {
  pi: '.pi/skills',
  'claude-code': '.claude/skills',
  codex: '.agents/skills',
};

const binaries = {
  skills: hostBinary('skills'),
  pi: hostBinary('pi'),
  claude: hostBinary('claude'),
  codex: hostBinary('codex'),
};

function run(sandbox, binaryName, args, input) {
  const result = runIsolated(sandbox, binaries[binaryName], args, { input });
  if (result.status !== 0) {
    throw new Error(
      `${binaryName} ${args.join(' ')} failed (exit ${result.status ?? result.error})\n`
      + `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
  return result.stdout;
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`✔ ${message}`);
}

function gitStatus() {
  return execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: repoRoot, encoding: 'utf8' });
}

async function smokeSkillsCli(name, agent) {
  await withIsolatedRoot(async (sandbox) => {
    run(sandbox, 'skills', ['add', repoRoot, '--skill', name, '--agent', agent, '--copy', '--yes']);
    const agentDir = path.join(sandbox.cwd, SKILLS_AGENT_DIRS[agent]);
    const installed = fs.existsSync(agentDir) ? fs.readdirSync(agentDir) : [];
    expect(
      installed.length === 1 && fs.existsSync(path.join(agentDir, name, 'SKILL.md')),
      `skills --agent ${agent}: only ${SKILLS_AGENT_DIRS[agent]}/${name}/SKILL.md installed (found: ${installed.join(', ') || 'nothing'})`,
    );
  });
}

async function smokePi(name) {
  const workspace = pluginPath(name);
  await withIsolatedRoot(async (sandbox) => {
    run(sandbox, 'pi', ['install', workspace]);

    const listLines = run(sandbox, 'pi', ['list']).split('\n').map((line) => line.trim());
    expect(listLines.includes(workspace), `pi list: reports ${workspace}`);

    const settingsFile = path.join(sandbox.env.PI_CODING_AGENT_DIR, 'settings.json');
    const packages = JSON.parse(fs.readFileSync(settingsFile, 'utf8')).packages;
    expect(packages.length === 1, `pi settings: exactly one package recorded (found ${packages.length})`);

    const rpcOutput = run(sandbox, 'pi', ['--mode', 'rpc', '--no-session'], '{"type":"get_commands","id":"1"}\n');
    const response = rpcOutput.split('\n').filter(Boolean).map((line) => JSON.parse(line)).find((message) => message.id === '1');
    const skills = response.data.commands.filter((command) => command.source === 'skill');
    expect(
      skills.length === 1 && skills[0].name === `skill:${name}` && skills[0].sourceInfo.baseDir === workspace,
      `pi get_commands: exactly one skill, skill:${name} from plugins/${name} (found: ${skills.map((skill) => skill.name).join(', ') || 'none'})`,
    );
  });
}

async function smokeClaude(name) {
  const pluginId = `${name}@${MARKETPLACE_NAME}`;
  await withIsolatedRoot(async (sandbox) => {
    run(sandbox, 'claude', ['plugin', 'marketplace', 'add', repoRoot]);
    run(sandbox, 'claude', ['plugin', 'install', pluginId]);
    const installed = JSON.parse(run(sandbox, 'claude', ['plugin', 'list', '--json'])).map((plugin) => plugin.id);
    expect(
      installed.length === 1 && installed[0] === pluginId,
      `claude plugin list: exactly ${pluginId} installed (found: ${installed.join(', ') || 'nothing'})`,
    );
  });
}

async function smokeCodex(name) {
  const pluginId = `${name}@${MARKETPLACE_NAME}`;
  await withIsolatedRoot(async (sandbox) => {
    run(sandbox, 'codex', ['plugin', 'marketplace', 'add', repoRoot, '--json']);
    run(sandbox, 'codex', ['plugin', 'add', pluginId, '--json']);
    const installed = JSON.parse(run(sandbox, 'codex', ['plugin', 'list', '--json'])).installed.map((plugin) => plugin.pluginId);
    expect(
      installed.length === 1 && installed[0] === pluginId,
      `codex plugin list: exactly ${pluginId} installed (found: ${installed.join(', ') || 'nothing'})`,
    );
  });
}

async function main() {
  const statusBefore = gitStatus();
  for (const name of listPluginNames()) {
    console.log(`${name}:`);
    for (const agent of Object.keys(SKILLS_AGENT_DIRS)) {
      await smokeSkillsCli(name, agent);
    }
    await smokePi(name);
    await smokeClaude(name);
    await smokeCodex(name);
  }
  expect(gitStatus() === statusBefore, 'repository git status unchanged by the smoke installs');
}

try {
  await main();
} catch (error) {
  console.error(`✘ ${error.message}`);
  process.exitCode = 1;
}
