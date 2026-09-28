// Fails on relative Markdown links whose target is missing or escapes its boundary:
// the skill directory for files under plugins/<name>/skills/<skill>/ (installers copy
// only that directory), the plugin root for other files under plugins/<name>/, and
// the repo root for everything else.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pluginPath, relativeToRepo, repoRoot } from './lib/repo.mjs';

const INLINE_LINK = /\[[^\]]*\]\(([^)\s]*)/g;
const REFERENCE_DEFINITION = /^ {0,3}\[[^\]]+\]:\s*(\S+)/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const IGNORED_TARGET = /^(https?:|mailto:|#)/i;

function listMarkdownFiles() {
  const output = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '*.md'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  // Tracked files deleted from disk but not yet staged are still listed; they have no links to check.
  return output.split('\0').filter(Boolean).filter((file) => fs.existsSync(path.join(repoRoot, file)));
}

function boundaryFor(file) {
  const [top, pluginName, skillsDir, skillName, ...rest] = file.split('/');
  if (top !== 'plugins' || skillsDir === undefined) {
    return repoRoot;
  }
  if (skillsDir === 'skills' && rest.length > 0) {
    return pluginPath(pluginName, 'skills', skillName);
  }
  return pluginPath(pluginName);
}

// Returns link targets outside fenced code blocks and inline code spans.
function extractTargets(text) {
  const targets = [];
  let openFence = null;
  for (const line of text.split('\n')) {
    const fence = line.match(FENCE);
    if (fence && openFence === null) {
      openFence = fence[1][0];
      continue;
    }
    if (fence && fence[1][0] === openFence) {
      openFence = null;
      continue;
    }
    if (openFence !== null) {
      continue;
    }

    const prose = line.replace(/(`+).*?\1/g, '');
    for (const match of prose.matchAll(INLINE_LINK)) {
      targets.push(match[1]);
    }
    const reference = prose.match(REFERENCE_DEFINITION);
    if (reference) {
      targets.push(reference[1]);
    }
  }
  return targets;
}

const errors = [];
let checkedLinks = 0;
const files = listMarkdownFiles();

for (const file of files) {
  const absoluteFile = path.join(repoRoot, file);
  const boundary = boundaryFor(file);
  for (const target of extractTargets(fs.readFileSync(absoluteFile, 'utf8'))) {
    if (IGNORED_TARGET.test(target)) {
      continue;
    }
    checkedLinks += 1;
    const targetPath = target.split('#')[0].split('?')[0];
    const resolved = path.resolve(path.dirname(absoluteFile), targetPath);
    const fromBoundary = path.relative(boundary, resolved);
    if (fromBoundary.startsWith('..') || path.isAbsolute(fromBoundary)) {
      errors.push(`${file}: link "${target}" escapes ${relativeToRepo(boundary) || 'the repository root'}`);
      continue;
    }
    if (!fs.existsSync(resolved)) {
      errors.push(`${file}: link "${target}" points to missing ${relativeToRepo(resolved)}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`✘ ${error}`);
  }
  console.error(`✘ link check failed with ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`✔ ${checkedLinks} relative links in ${files.length} Markdown files resolve inside their boundary`);
