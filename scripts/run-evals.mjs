// Runs the skill eval suites in evals/<plugin>/ with `claude plugin eval`.
//
//   node scripts/run-evals.mjs --check
//     Free: checks suite structure and that every case loads, without credentials
//     or model calls (a $0 cost ceiling stops the run before the first agent starts).
//   node scripts/run-evals.mjs [--plugin <name>]... [--changed <git-ref>] [options]
//     Paid: runs the selected suites on your Claude Code credentials and fails when
//     any case scores below --threshold. See evals/README.md.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import YAML from 'yaml';
import { runIsolated, withIsolatedRoot } from './lib/isolated-env.mjs';
import { fail, hostBinary, listPluginNames, relativeToRepo, repoRoot } from './lib/repo.mjs';

const EVALS_DIR = path.join(repoRoot, 'evals');
const RESULTS_DIR = path.join(repoRoot, 'eval-results');
const SUITE_IGNORED_ENTRIES = ['README.md', 'results'];
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?(?:\n|$)/;

const { values: options } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    plugin: { type: 'string', multiple: true, default: [] },
    changed: { type: 'string' },
    runs: { type: 'string' },
    model: { type: 'string', default: process.env.EVAL_MODEL || 'claude-sonnet-5-5' },
    'judge-model': { type: 'string', default: process.env.EVAL_JUDGE_MODEL || 'claude-haiku-5-5' },
    threshold: { type: 'string', default: '0.8' },
    'max-cost-usd': { type: 'string' },
    concurrency: { type: 'string', default: '2' },
    tag: { type: 'string', multiple: true, default: [] },
    baseline: { type: 'boolean', default: false },
  },
});

function readFrontmatter(file) {
  const match = fs.readFileSync(file, 'utf8').match(FRONTMATTER);
  return match ? (YAML.parse(match[1]) ?? {}) : {};
}

function listSuites() {
  return fs.readdirSync(EVALS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listCases(suite) {
  const suiteDir = path.join(EVALS_DIR, suite);
  return fs.readdirSync(suiteDir)
    .filter((entry) => !SUITE_IGNORED_ENTRIES.includes(entry))
    .map((entry) => path.join(suiteDir, entry));
}

// A Skill trigger grader for `skill`, as the eval runner sees it in the trace.
function triggersSkill(grader, skill) {
  if (grader.type !== 'tool_used' || grader.tool !== 'Skill' || typeof grader.input_match !== 'string') {
    return false;
  }
  const pattern = new RegExp(grader.input_match);
  return pattern.test(JSON.stringify({ skill })) && pattern.test(JSON.stringify({ skill: `${skill}:${skill}` }));
}

// Structure the eval runner does not enforce: one suite per plugin, cases that load
// their own plugin, and a positive and a near-miss negative trigger case per suite.
function checkStructure() {
  const errors = [];
  const plugins = listPluginNames();
  const suites = listSuites();

  for (const plugin of plugins.filter((name) => !suites.includes(name))) {
    errors.push(`evals/${plugin}/: missing eval suite for plugins/${plugin}`);
  }
  for (const suite of suites.filter((name) => !plugins.includes(name))) {
    errors.push(`evals/${suite}/: no plugin named ${suite} under plugins/`);
  }

  for (const suite of suites.filter((name) => plugins.includes(name))) {
    const expectedPlugin = `../../../plugins/${suite}`;
    let positive = 0;
    let negative = 0;
    for (const caseDir of listCases(suite)) {
      const promptFile = path.join(caseDir, 'prompt.md');
      if (!fs.existsSync(promptFile)) {
        errors.push(`${relativeToRepo(caseDir)}: every case needs a prompt.md`);
        continue;
      }
      const loaded = readFrontmatter(promptFile).plugins;
      if (!Array.isArray(loaded) || !loaded.includes(expectedPlugin)) {
        errors.push(`${relativeToRepo(promptFile)}: plugins must include "${expectedPlugin}"`);
      }
      const gradersDir = path.join(caseDir, 'graders');
      const graders = fs.existsSync(gradersDir)
        ? fs.readdirSync(gradersDir).filter((file) => file.endsWith('.md')).map((file) => readFrontmatter(path.join(gradersDir, file)))
        : [];
      for (const grader of graders.filter((candidate) => triggersSkill(candidate, suite))) {
        if (grader.max === 0) {
          negative += 1;
        } else {
          positive += 1;
        }
      }
    }
    if (positive === 0) {
      errors.push(`evals/${suite}/: needs at least one case with a tool_used Skill grader that expects ${suite} to fire`);
    }
    if (negative === 0) {
      errors.push(`evals/${suite}/: needs at least one near-miss case with a tool_used Skill grader for ${suite} and max: 0`);
    }
  }

  for (const error of errors) {
    console.error(`✘ ${error}`);
  }
  if (errors.length === 0) {
    console.log(`✔ ${suites.length} eval suites cover every plugin, each with positive and negative trigger cases`);
  }
  return errors.length === 0;
}

// Loads every case through the real eval runner, with no credentials and a $0 ceiling.
async function checkCasesLoad() {
  const claude = hostBinary('claude');
  return withIsolatedRoot(async (sandbox) => {
    const outputDir = path.join(sandbox.env.TMPDIR, 'eval-results');
    const jsonFile = path.join(outputDir, 'result.json');
    const result = runIsolated(sandbox, claude, [
      'plugin', 'eval', repoRoot,
      '--eval-dir', 'evals',
      '--trust-plugin', '--no-publish', '--ablation', 'none',
      '--max-cost-usd', '0',
      '--output-dir', outputDir,
      '--json', jsonFile,
    ]);
    const output = `${result.stdout}${result.stderr}`;
    const report = fs.existsSync(jsonFile) ? JSON.parse(fs.readFileSync(jsonFile, 'utf8')) : null;
    // Exit 2 with cost_ceiling means every case loaded and the run stopped before the first model call.
    if (result.status !== 2 || report?.partialReason !== 'cost_ceiling' || /failed to load/.test(output)) {
      console.error(output.trim());
      console.error(`✘ eval cases did not all load (exit ${result.status ?? result.error})`);
      return false;
    }
    console.log(`✔ every eval case loads (${report.suite.plugins.length} plugins resolved)`);
    return true;
  });
}

function changedPlugins(ref) {
  const result = spawnSync('git', ['diff', '--name-only', `${ref}...HEAD`], { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    fail(`git diff ${ref}...HEAD failed: ${result.stderr.trim()}`);
  }
  const touched = new Set();
  for (const file of result.stdout.split('\n')) {
    const [top, name] = file.split('/');
    if ((top === 'plugins' || top === 'evals') && name) {
      touched.add(name);
    }
  }
  return listSuites().filter((suite) => touched.has(suite));
}

function selectSuites() {
  const suites = listSuites();
  const selected = new Set(options.plugin);
  for (const name of selected) {
    if (!suites.includes(name)) {
      fail(`no eval suite evals/${name}/`);
    }
  }
  if (options.changed) {
    for (const name of changedPlugins(options.changed)) {
      selected.add(name);
    }
    return [...selected].sort();
  }
  return selected.size > 0 ? [...selected].sort() : suites;
}

function runSuite(claude, suite) {
  const outputDir = path.join(RESULTS_DIR, suite);
  fs.rmSync(outputDir, { recursive: true, force: true });
  const jsonFile = path.join(outputDir, 'result.json');
  const args = [
    'plugin', 'eval', repoRoot,
    '--eval-dir', `evals/${suite}`,
    '--trust-plugin', '--no-publish',
    '--ablation', options.baseline ? 'with-without' : 'none',
    '--model', options.model,
    '--judge-model', options['judge-model'],
    '--threshold', options.threshold,
    '--concurrency', options.concurrency,
    '--output-dir', outputDir,
    '--report', path.join(outputDir, 'report.html'),
    '--json', jsonFile,
  ];
  if (options.runs) {
    args.push('--runs', options.runs);
  }
  if (options['max-cost-usd']) {
    args.push('--max-cost-usd', options['max-cost-usd']);
  }
  if (options.tag.length > 0) {
    args.push('--tag', ...options.tag);
  }
  console.log(`\n▶ evals/${suite}`);
  const result = spawnSync(claude, args, { cwd: repoRoot, stdio: 'inherit' });
  const report = fs.existsSync(jsonFile) ? JSON.parse(fs.readFileSync(jsonFile, 'utf8')) : null;
  return { suite, status: result.status, report };
}

// One line per failed grader per run, with the judge's explanation, so a red run
// can be diagnosed from the log without the HTML report.
function failedGraders(results) {
  const lines = [];
  for (const { suite, report } of results) {
    for (const evalCase of report?.cases ?? []) {
      evalCase.arms.with.forEach((run, index) => {
        if (run.error) {
          lines.push(`- ${suite}/${evalCase.name} run ${index + 1}: ${run.error}`);
        }
        for (const grader of run.graders ?? []) {
          if (grader.scored && grader.passed === false) {
            lines.push(`- ${suite}/${evalCase.name} run ${index + 1}: \`${grader.name}\` ${grader.explanation ?? ''}`.trimEnd());
          }
        }
      });
    }
  }
  return lines;
}

function formatSummary(results) {
  const lines = [
    '| Suite | Case | Score | Δ vs no skill |',
    '|---|---|---|---|',
  ];
  let cost = 0;
  for (const { suite, status, report } of results) {
    cost += report?.costUsd ?? 0;
    if (!report || report.cases.length === 0) {
      lines.push(`| ${suite} | (no results, exit ${status}) | | |`);
      continue;
    }
    for (const evalCase of report.cases) {
      const { score, delta } = evalCase.aggregates;
      const mark = score >= Number(options.threshold) ? '✔' : '✘';
      const deltaText = typeof delta === 'number' ? delta.toFixed(2) : '';
      lines.push(`| ${suite} | ${evalCase.name} | ${mark} ${score.toFixed(2)} | ${deltaText} |`);
    }
    if (report.partial) {
      lines.push(`| ${suite} | (partial run: ${report.partialReason}) | | |`);
    }
  }
  const failures = failedGraders(results);
  if (failures.length > 0) {
    lines.push('', 'Failed graders:', '', ...failures);
  }
  lines.push('', `Model: \`${options.model}\`, judge: \`${options['judge-model']}\`, threshold: ${options.threshold}, estimated cost: $${cost.toFixed(2)}`);
  return lines.join('\n');
}

if (options.check) {
  if (!checkStructure() || !(await checkCasesLoad())) {
    process.exit(1);
  }
  process.exit(0);
}

const suites = selectSuites();
if (suites.length === 0) {
  console.log('No eval suites selected (no changed plugins or evals).');
  process.exit(0);
}
const claude = hostBinary('claude');
const results = suites.map((suite) => runSuite(claude, suite));
const summary = formatSummary(results);
console.log(`\n${summary}`);
const failed = results.filter((result) => result.status !== 0);
if (failed.length > 0) {
  fail(`eval suites failed: ${failed.map((result) => `${result.suite} (exit ${result.status})`).join(', ')}`);
}
console.log(`\n✔ ${results.length} eval suite(s) passed`);
