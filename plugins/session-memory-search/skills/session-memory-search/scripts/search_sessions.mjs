#!/usr/bin/env node
// Search local Codex, Pi, and Claude Code session history.
//
// Fast path: cheap date/project pruning from metadata and session content,
// then a ripgrep file prefilter. Candidate JSONL files are streamed with
// bounded line memory, so broad queries cannot overflow child-process stdout.
// Regex or unsafe-token searches fall back to the same streamed scanner.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { StringDecoder } from "node:string_decoder";

const HOME = os.homedir();
const CODEX_HISTORY = path.join(HOME, ".codex", "history.jsonl");
const CODEX_SESSIONS = path.join(HOME, ".codex", "sessions");
const PI_SESSIONS = path.join(HOME, ".pi", "agent", "sessions");
const CLAUDE_PROJECTS = path.join(HOME, ".claude", "projects");
const UUID_RE =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const PROVIDERS = ["all", "codex", "pi", "claude"];
const LIVE_SESSION_WINDOW_MS = 15 * 60 * 1000;
const MAX_JSONL_LINE_CHARS = 16 * 1024 * 1024;

function usage() {
  console.error(
    `Usage: search_sessions.mjs [options] <query>
  --provider all|codex|pi|claude   store(s) to search (default all)
  --phrase                         exact phrase match
  --any-term                       match any keyword instead of all
  --regex                          treat query as regex
  --since YYYY-MM-DD               only hits on/after this date
  --until YYYY-MM-DD               only hits on/before this date
  --project SUBSTR                 filter by project path substring
  --include-subagents              include Claude subagents/ sessions
  --include-tool-output            search raw tool results (snippets stay redacted)
  --authored                       prioritize sessions that edited matching paths
  --group-by-project               group output by project
  --limit N                        max sessions in output (default 10)
  --max-snippets N                 snippets per session (default 3)
  --exclude-path PATH              hide a session file (repeatable)
  --include-latest                 include sessions modified in the last 15 minutes
  --no-prefilter                   force full scan (skip ripgrep prefilter)
  --stats                          print scan statistics to stderr
  --json                           machine-readable output`,
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    provider: "all",
    phrase: false,
    anyTerm: false,
    regex: false,
    since: null,
    until: null,
    project: null,
    includeSubagents: false,
    includeToolOutput: false,
    authored: false,
    groupByProject: false,
    limit: 10,
    maxSnippets: 3,
    excludePaths: [],
    includeLatest: false,
    noPrefilter: false,
    stats: false,
    json: false,
    query: "",
  };

  const parts = [...argv];
  while (parts.length > 0) {
    const current = parts.shift();
    if (!current) continue;
    if (!current.startsWith("--")) {
      args.query = [current, ...parts].join(" ").trim();
      break;
    }
    switch (current) {
      case "--phrase": args.phrase = true; break;
      case "--any-term": args.anyTerm = true; break;
      case "--regex": args.regex = true; break;
      case "--json": args.json = true; break;
      case "--include-latest": args.includeLatest = true; break;
      case "--include-subagents": args.includeSubagents = true; break;
      case "--include-tool-output": args.includeToolOutput = true; break;
      case "--authored": args.authored = true; break;
      case "--group-by-project": args.groupByProject = true; break;
      case "--no-prefilter": args.noPrefilter = true; break;
      case "--stats": args.stats = true; break;
      case "--provider": args.provider = parts.shift() || ""; break;
      case "--since": args.since = parts.shift() || null; break;
      case "--until": args.until = parts.shift() || null; break;
      case "--project": args.project = parts.shift() || null; break;
      case "--limit": args.limit = Number(parts.shift() || "10"); break;
      case "--max-snippets": args.maxSnippets = Number(parts.shift() || "3"); break;
      case "--exclude-path": {
        const p = parts.shift() || "";
        if (!p) usage();
        args.excludePaths.push(path.resolve(p));
        break;
      }
      default: usage();
    }
  }

  if (!PROVIDERS.includes(args.provider)) usage();
  if (!args.query) usage();
  if (!Number.isFinite(args.limit) || args.limit < 1) usage();
  if (!Number.isFinite(args.maxSnippets) || args.maxSnippets < 1) usage();
  for (const d of [args.since, args.until]) {
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) usage();
  }
  if (args.authored) args.includeSubagents = true;
  return args;
}

function cleanText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function clip(value, limit = 220) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 3)}...`;
}

// ---------------------------------------------------------------------------
// File listing with cheap metadata (mtime, birthtime) for pruning.

function walkJsonlFiles(root) {
  const results = [];
  if (!fs.existsSync(root)) return results;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let stat;
    try {
      stat = fs.statSync(current);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) stack.push(path.join(current, entry));
      continue;
    }
    if (current.endsWith(".jsonl")) {
      results.push({ file: current, mtimeMs: stat.mtimeMs, birthtimeMs: stat.birthtimeMs });
    }
  }
  results.sort((a, b) => a.file.localeCompare(b.file));
  return results;
}

function recentJsonlFiles(files, now = Date.now()) {
  return files
    .filter((entry) => now - entry.mtimeMs <= LIVE_SESSION_WINDOW_MS)
    .map((entry) => path.resolve(entry.file));
}

function sessionIdFromPath(filePath) {
  const match = path.basename(filePath).match(UUID_RE);
  return match ? match[1] : null;
}

function isoFromEpoch(value) {
  if (value === null || value === undefined) return null;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return null;
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

function dateOfMs(ms) {
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

// Session start date encoded in the path, when available.
function startDateFromPath(provider, filePath) {
  if (provider === "codex") {
    const m = filePath.match(/sessions[/\\](\d{4})[/\\](\d{2})[/\\](\d{2})[/\\]/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }
  if (provider === "pi") {
    const m = path.basename(filePath).match(/^(\d{4}-\d{2}-\d{2})T/);
    return m ? m[1] : null;
  }
  return null;
}

// Prune a file by date window using only path + stat metadata.
// Safe direction only: never drop a file that could contain in-window entries.
function outsideDateWindow(provider, entry, since, until) {
  if (since) {
    // Entries are written at wall-clock time <= last modification.
    const mtimeDate = dateOfMs(entry.mtimeMs);
    if (mtimeDate && mtimeDate < since) return true;
  }
  if (until) {
    const start = startDateFromPath(provider, entry.file);
    if (start && start > until) return true;
    if (!start && entry.birthtimeMs > 0 && entry.birthtimeMs <= entry.mtimeMs) {
      const birthDate = dateOfMs(entry.birthtimeMs);
      if (birthDate && birthDate > until) return true;
    }
  }
  return false;
}

// Project path encoded in directory names (Pi and Claude).
function claudeProjectFromPath(filePath) {
  const rel = path.relative(CLAUDE_PROJECTS, filePath);
  const top = rel.split(path.sep)[0] || "";
  return top.replace(/^-/, "/").replace(/-/g, "/");
}

function piProjectFromPath(filePath) {
  const rel = path.relative(PI_SESSIONS, filePath);
  const top = rel.split(path.sep)[0] || "";
  return top.replace(/^-+/, "/").replace(/-+$/, "").replace(/-/g, "/");
}

// Read only the head of a file (for Codex session_meta cwd).
function readHead(filePath, bytes = 4096) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(bytes);
    const n = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.toString("utf8", 0, n);
  } catch {
    return "";
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function codexProjectFromHead(filePath) {
  const head = readHead(filePath);
  const m = head.match(/"cwd"\s*:\s*"([^"]*)"/);
  return m ? m[1] : null;
}

const headProjectCache = new Map();
function projectFromHeadCached(filePath) {
  if (!headProjectCache.has(filePath)) {
    headProjectCache.set(filePath, codexProjectFromHead(filePath));
  }
  return headProjectCache.get(filePath);
}

function projectFilterMatches(project, filePath, filter) {
  if (!filter) return true;
  const needle = filter.toLowerCase();
  if (project && project.toLowerCase().includes(needle)) return true;
  return filePath.toLowerCase().includes(needle);
}

function initialProjectFor(provider, filePath) {
  if (provider === "claude") return claudeProjectFromPath(filePath);
  if (provider === "pi") return piProjectFromPath(filePath);
  return codexProjectFromHead(filePath);
}

// A session can start in one repository and later inspect or edit another.
// Keep sessions whose initial cwd matches OR whose content references the
// requested project. The latter catches tool workdirs, absolute paths and
// explicit `cd` commands without requiring provider-specific schemas.
function filterEntriesByProject(provider, entries, filter) {
  if (!filter || entries.length === 0) return entries;
  const initiallyMatching = new Set(
    entries
      .filter((entry) => projectFilterMatches(initialProjectFor(provider, entry.file), entry.file, filter))
      .map((entry) => entry.file),
  );
  const contentMatches = rgFilesWithMatch(filter, entries.map((entry) => entry.file));
  if (contentMatches === null) {
    const needle = filter.toLowerCase();
    for (const entry of entries) {
      if (initiallyMatching.has(entry.file)) continue;
      const scanStats = {};
      for (const line of readJsonlLines(entry.file, scanStats)) {
        if (line.toLowerCase().includes(needle)) {
          initiallyMatching.add(entry.file);
          break;
        }
      }
    }
    return entries.filter((entry) => initiallyMatching.has(entry.file));
  }
  for (const file of contentMatches) initiallyMatching.add(file);
  return entries.filter((entry) => initiallyMatching.has(entry.file));
}

// ---------------------------------------------------------------------------
// Matching.

class Matcher {
  constructor(query, { phrase, anyTerm, regex }) {
    this.query = query.trim();
    this.queryLower = this.query.toLowerCase();
    this.phrase = phrase;
    this.anyTerm = anyTerm;
    this.regex = regex;
    this.tokens = this.queryLower.split(/\s+/).filter(Boolean);
    this.pattern = regex ? new RegExp(this.query, "i") : null;
    this.tokenPatterns = this.tokens.map((token) => {
      if (!/^[a-z0-9_]+$/i.test(token)) return null;
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?<![a-z0-9_])${escaped}(?![a-z0-9_])`, "i");
    });
  }

  tokenMatches(text, index) {
    const token = this.tokens[index];
    const pattern = this.tokenPatterns[index];
    return pattern ? pattern.test(text) : text.toLowerCase().includes(token);
  }

  matches(text) {
    if (!text) return false;
    const lowered = text.toLowerCase();
    if (this.regex) return this.pattern.test(text);
    if (this.phrase) return lowered.includes(this.queryLower);
    if (this.tokens.length === 0) return false;
    if (this.anyTerm) return this.tokens.some((_, i) => this.tokenMatches(text, i));
    return this.tokens.every((_, i) => this.tokenMatches(text, i));
  }

  matchedTokenCount(text) {
    if (!text) return 0;
    const lowered = text.toLowerCase();
    if (this.regex || this.phrase) return this.matches(text) ? 1 : 0;
    return this.tokens.filter((_, i) => this.tokenMatches(text, i)).length;
  }
}

// ---------------------------------------------------------------------------
// Ripgrep candidate prefilter.
//
// A token is prefilter-safe only when JSON string escaping cannot change its
// byte representation: printable ASCII without quote or backslash. Unsafe
// tokens (or regex mode) force a full scan of the pruned candidate list.

let rgAvailable = null;
function hasRipgrep() {
  if (rgAvailable === null) {
    const probe = spawnSync("rg", ["--version"], { stdio: "ignore" });
    rgAvailable = !probe.error && probe.status === 0;
  }
  return rgAvailable;
}

function prefilterSafeToken(token) {
  return /^[\x20-\x7e]+$/.test(token) && !/["\\]/.test(token);
}

function prefilterTokens(matcher) {
  if (matcher.regex) return null;
  const tokens = matcher.tokens;
  if (tokens.length === 0) return null;
  if (!tokens.every(prefilterSafeToken)) return null;
  return tokens;
}

function rgFilesWithMatch(token, files) {
  const survivors = [];
  const BATCH = 500;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const res = spawnSync(
      "rg",
      ["-l", "-i", "-F", "--no-messages", "--", token, ...batch],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    if (res.error || (res.status !== 0 && res.status !== 1)) {
      return null; // rg failed; caller falls back to full scan
    }
    for (const line of (res.stdout || "").split("\n")) {
      if (line) survivors.push(line);
    }
  }
  return survivors;
}

function rgFilesWithAnyMatch(tokens, files) {
  const survivors = [];
  const BATCH = 500;
  const patternArgs = tokens.flatMap((t) => ["-e", t]);
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const res = spawnSync(
      "rg",
      ["-l", "-i", "-F", "--no-messages", ...patternArgs, "--", ...batch],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    if (res.error || (res.status !== 0 && res.status !== 1)) return null;
    for (const line of (res.stdout || "").split("\n")) {
      if (line) survivors.push(line);
    }
  }
  return survivors;
}

// Line gate: skip JSON.parse for lines that cannot contain a match. Safe for
// the same token class as the prefilter (JSON escaping cannot hide them).
// Only matching lines contribute results (timestamps/snippets come from
// matched entries), so skipping non-matching lines never changes output.
// Meta lines that carry the project cwd are let through until cwd is known.
function makeLineGate(matcher, args) {
  if (args.noPrefilter) return null;
  const tokens = prefilterTokens(matcher);
  if (!tokens) return null;
  const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Case-insensitive regex .test avoids allocating a lowercased copy of
  // every line, which dominates cost on large tool-output lines.
  const patterns = tokens.map((t) => new RegExp(escape(t), "i"));
  const cwdRe = /"cwd"/;
  if (matcher.anyTerm) {
    return (line) => patterns.some((re) => re.test(line)) || cwdRe.test(line);
  }
  // AND / phrase: every token must be present in the line.
  return (line) => patterns.every((re) => re.test(line)) || cwdRe.test(line);
}

// Read JSONL incrementally. The previous implementation captured matching
// ripgrep output in one string, which can exceed V8's maximum string length on
// broad queries. Very large individual lines are almost always raw tool output;
// skip them with a statistic instead of risking process-wide failure.
function* readJsonlLines(filePath, stats) {
  const fd = fs.openSync(filePath, "r");
  const decoder = new StringDecoder("utf8");
  const buffer = Buffer.allocUnsafe(256 * 1024);
  let pending = "";
  let droppingOversized = false;

  const markOversized = () => {
    stats.oversized_lines_skipped = (stats.oversized_lines_skipped || 0) + 1;
  };

  const consume = function* (text) {
    let start = 0;
    while (start <= text.length) {
      const newline = text.indexOf("\n", start);
      const end = newline === -1 ? text.length : newline;
      const segment = text.slice(start, end);

      if (droppingOversized) {
        if (newline === -1) return;
        droppingOversized = false;
        start = newline + 1;
        continue;
      }

      if (pending.length + segment.length > MAX_JSONL_LINE_CHARS) {
        pending = "";
        markOversized();
        if (newline === -1) droppingOversized = true;
      } else {
        pending += segment;
        if (newline !== -1) {
          if (pending.endsWith("\r")) pending = pending.slice(0, -1);
          yield pending;
          pending = "";
        }
      }

      if (newline === -1) return;
      start = newline + 1;
    }
  };

  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead > 0) yield* consume(decoder.write(buffer.subarray(0, bytesRead)));
    } while (bytesRead > 0);
    yield* consume(decoder.end());
    if (!droppingOversized && pending) yield pending;
  } finally {
    fs.closeSync(fd);
  }
}

// Returns the subset of filePaths that can possibly match, or filePaths
// unchanged when the prefilter does not apply.
function prefilterFiles(filePaths, matcher, args) {
  if (args.noPrefilter || filePaths.length === 0 || !hasRipgrep()) return filePaths;
  const tokens = prefilterTokens(matcher);
  if (!tokens) return filePaths;

  if (matcher.anyTerm) {
    const result = rgFilesWithAnyMatch(tokens, filePaths);
    return result === null ? filePaths : result;
  }

  // AND semantics (also phrase mode: all phrase tokens must be present).
  // Cascade rarest-first: longer tokens are usually rarer.
  const ordered = [...tokens].sort((a, b) => b.length - a.length);
  let survivors = filePaths;
  for (const token of ordered) {
    const next = rgFilesWithMatch(token, survivors);
    if (next === null) return filePaths;
    survivors = next;
    if (survivors.length === 0) break;
  }
  return survivors;
}

// ---------------------------------------------------------------------------
// Snippets, noise filtering, result accumulation.

function redactSensitive(value) {
  let text = String(value);
  text = text.replace(
    /(authorization\s*[:=]\s*(?:basic|bearer)\s+)[^\s,;"']+/gi,
    "$1<redacted>",
  );
  text = text.replace(
    /((?:password|passwd|token|secret|api[_-]?key|credential|ciphertext)\s*["']?\s*[:=]\s*["']?)[^\s,;"']+/gi,
    "$1<redacted>",
  );
  text = text.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "<redacted:jwt>");
  text = text.replace(/\b[A-Za-z0-9+_=-]{64,}\b/g, (token) => {
    const classes = [/[a-z]/.test(token), /[A-Z]/.test(token), /[0-9]/.test(token)];
    return classes.filter(Boolean).length >= 2 ? "<redacted:encoded>" : token;
  });
  return text;
}

function snippetFor(text, matcher) {
  const normalized = cleanText(redactSensitive(text));
  if (!normalized) return "";
  const lowered = normalized.toLowerCase();
  let start = -1;
  let length = 0;

  if (matcher.regex) {
    const match = normalized.match(matcher.pattern);
    if (match && match.index !== undefined) {
      start = match.index;
      length = Math.max(1, match[0].length);
    }
  } else if (matcher.phrase) {
    start = lowered.indexOf(matcher.queryLower);
    length = matcher.query.length;
  } else {
    for (const token of matcher.tokens) {
      const index = lowered.indexOf(token);
      if (index !== -1) {
        start = index;
        length = token.length;
        break;
      }
    }
  }

  if (start === -1) return clip(normalized);
  const left = Math.max(0, start - 80);
  const right = Math.min(normalized.length, start + Math.max(length, 1) + 120);
  let snippet = normalized.slice(left, right);
  if (left > 0) snippet = `...${snippet}`;
  if (right < normalized.length) snippet = `${snippet}...`;
  return snippet;
}

const NOISE_PREFIXES = [
  "<command-name>",
  "<local-command-stdout>",
  "<local-command-caveat>",
  "<command-message>",
  "<system-reminder>",
  "<task-notes>",
  "<user-prompt-submit-hook>",
];
const CONTINUATION_RE =
  /^this session is being continued from a previous conversation/i;

function isNoise(text) {
  const t = text.trimStart();
  if (!t) return true;
  for (const p of NOISE_PREFIXES) {
    if (t.startsWith(p)) return true;
  }
  if (t.startsWith("Caveat: The messages below were generated")) return true;
  return false;
}

function textWeight(text, role, authored) {
  if (role === "commit") return authored ? 16 : 3;
  if (role === "edit") return authored ? 12 : 2;
  if (role === "action") return authored ? 1 : 0.25;
  if (role === "user") return 3;
  if (role === "assistant") {
    if (
      authored &&
      /\b(?:implemented|created|added|updated|modified|refactored|fixed|committed|wrote|deleted|removed)\b/i.test(text)
    ) return 5;
    return 2;
  }
  return authored ? 0.25 : 0.5;
}

function inWindow(tsIso, since, until) {
  if (!tsIso) return true;
  const d = tsIso.slice(0, 10);
  if (since && d < since) return false;
  if (until && d > until) return false;
  return true;
}

function addResult(results, opts) {
  const {
    provider, filePath, sessionId, timestamp, text, matcher, maxSnippets,
    role = null, project = null, isSubagent = false, since, until,
    authored = false, parentSessionId = null, subagentId = null,
    projectMatch = null,
  } = opts;
  if (!matcher.matches(text)) return;
  if (!inWindow(timestamp, since, until)) return;

  const key = `${provider}:${filePath}`;
  if (!results.has(key)) {
    results.set(key, {
      provider,
      path: filePath,
      session_id: sessionId,
      project,
      project_matches: projectMatch ? [projectMatch] : [],
      is_subagent: isSubagent,
      parent_session_id: parentSessionId,
      subagent_id: subagentId,
      hits: 0,
      score: 0,
      authorship_score: 0,
      evidence: { user: 0, assistant: 0, edit: 0, commit: 0, action: 0, tool: 0 },
      touched_paths: [],
      first_ts: null,
      last_ts: null,
      snippets: [],
      _snippetKeys: new Set(),
      _touchedPaths: new Set(),
      has_continuation_summary: false,
    });
  }

  const result = results.get(key);
  if (project && !result.project) result.project = project;
  if (projectMatch && !result.project_matches.includes(projectMatch)) {
    result.project_matches.push(projectMatch);
  }
  const isContinuation = CONTINUATION_RE.test(text.trimStart());
  if (isContinuation) {
    if (result.has_continuation_summary) return;
    result.has_continuation_summary = true;
  }
  result.hits += 1;
  const weight = isContinuation ? 0.25 : textWeight(text, role, authored);
  result.score +=
    weight *
    Math.max(1, matcher.matchedTokenCount(text));
  if (role && Object.hasOwn(result.evidence, role)) result.evidence[role] += 1;
  if (role === "action" || role === "edit" || role === "commit") {
    result.authorship_score += weight * Math.max(1, matcher.matchedTokenCount(text));
    if (role === "edit" || role === "commit") {
      for (const matched of text.matchAll(/(?:^|\s)(?:path|paths):([^\n]+)/g)) {
        for (const candidate of matched[1].split(",")) {
          const cleaned = candidate.trim();
          if (cleaned) result._touchedPaths.add(cleaned);
        }
      }
      result.touched_paths = [...result._touchedPaths].slice(0, 20);
    }
  }

  if (timestamp) {
    if (!result.first_ts || timestamp < result.first_ts) result.first_ts = timestamp;
    if (!result.last_ts || timestamp > result.last_ts) result.last_ts = timestamp;
  }

  const snippet = snippetFor(text, matcher);
  const snippetKey = snippet.toLowerCase();
  if (
    snippet &&
    !result._snippetKeys.has(snippetKey) &&
    result.snippets.length < maxSnippets
  ) {
    result._snippetKeys.add(snippetKey);
    result.snippets.push(snippet);
  }
}

// ---------------------------------------------------------------------------
// Per-provider text extraction.

function sessionIdentity(provider, filePath) {
  const basename = path.basename(filePath);
  const directId = basename.match(UUID_RE)?.[1] || null;
  if (provider !== "claude" || !filePath.includes(`${path.sep}subagents${path.sep}`)) {
    return { sessionId: directId, parentSessionId: null, subagentId: null };
  }
  const uuids = [...filePath.matchAll(new RegExp(UUID_RE.source, "ig"))].map((match) => match[1]);
  const parentSessionId = uuids[0] || null;
  return {
    sessionId: parentSessionId,
    parentSessionId,
    subagentId: basename.replace(/\.jsonl$/i, ""),
  };
}

function collectReferencedPaths(value, key = "", output = new Set()) {
  if (value === null || value === undefined) return output;
  if (Array.isArray(value)) {
    for (const item of value) collectReferencedPaths(item, key, output);
    return output;
  }
  if (typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      collectReferencedPaths(child, childKey, output);
    }
    return output;
  }
  if (typeof value !== "string") return output;

  const trimmed = value.trim();
  if (/^(?:path|file|file_path|workdir|cwd|directory|target)$/i.test(key) && trimmed) {
    output.add(trimmed);
  }
  for (const match of value.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm)) {
    output.add(match[1].trim());
  }
  const pathLike = /(?:\/(?:[A-Za-z0-9_.@+()-]+\/)+[A-Za-z0-9_.@+()\[\]-]+)|(?:(?:\.\.\/|\.\/)(?:[A-Za-z0-9_.@+()-]+\/)*[A-Za-z0-9_.@+()\[\]-]+)|(?:(?:[A-Za-z0-9_.@+()-]+\/){2,}[A-Za-z0-9_.@+()\[\]-]+)|[A-Za-z0-9_.@+-]+\.(?:java|scala|kt|js|mjs|cjs|ts|tsx|jsx|py|go|rs|rb|php|sh|yaml|yml|json|jsonl|toml|xml|md|csv|sql|gradle|properties)/g;
  for (const match of value.matchAll(pathLike)) {
    const candidate = match[0];
    if (
      !candidate.includes("://") &&
      !/^\/(?:v\d+|api|telco)\//i.test(candidate)
    ) output.add(candidate);
  }
  return output;
}

function collectMutationPaths(value, key = "", output = new Set()) {
  if (value === null || value === undefined) return output;
  if (Array.isArray(value)) {
    for (const item of value) collectMutationPaths(item, key, output);
    return output;
  }
  if (typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      collectMutationPaths(child, childKey, output);
    }
    return output;
  }
  if (typeof value !== "string") return output;
  const trimmed = value.trim();
  if (/^(?:path|file|file_path|target)$/i.test(key) && trimmed) output.add(trimmed);
  const normalized = value.replace(/\\n/g, "\n");
  for (const match of normalized.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm)) {
    output.add(match[1].trim());
  }
  return output;
}

function summarizeToolAction(name, rawInput) {
  let input = rawInput;
  if (typeof rawInput === "string") {
    try {
      input = JSON.parse(rawInput);
    } catch {
      input = rawInput;
    }
  }
  const normalizedName = String(name || "unknown").toLowerCase();
  const rawText = typeof rawInput === "string" ? rawInput : JSON.stringify(rawInput || {});
  let role = "action";
  if (/^(?:apply_patch|edit|write|multiedit|notebookedit)$/.test(normalizedName)) {
    role = "edit";
  } else if (/\b(?:tools\.)?apply_patch\b|\b(?:sed\s+-i|perl\s+-pi|git\s+apply)\b/.test(rawText)) {
    role = "edit";
  } else if (/\bgit\s+commit\b/.test(rawText)) {
    role = "commit";
  }
  const paths = [
    ...(role === "edit" || role === "commit"
      ? collectMutationPaths(input)
      : collectReferencedPaths(input)),
  ].slice(0, 40);
  return {
    text: `${role}:${name || "unknown"}${paths.length > 0 ? ` paths:${paths.join(",")}` : ""}`,
    role,
  };
}

function iterCodexTexts(entry) {
  const texts = [];
  if (entry.type === "response_item") {
    const payload = entry.payload || {};
    if (payload.type === "message") {
      const role = payload.role;
      if (role === "user" || role === "assistant") {
        for (const item of payload.content || []) {
          if (typeof item.text === "string") texts.push({ text: item.text, role });
        }
      }
    }
    if (payload.type === "function_call_output" && typeof payload.output === "string") {
      texts.push({ text: payload.output, role: "tool" });
    }
    if (payload.type === "function_call") {
      texts.push(summarizeToolAction(payload.name, payload.arguments));
    }
    if (payload.type === "custom_tool_call") {
      texts.push(summarizeToolAction(payload.name, payload.input));
    }
  }
  if (entry.type === "event_msg") {
    const payload = entry.payload || {};
    if (payload.type === "user_message" && typeof payload.message === "string") {
      texts.push({ text: payload.message, role: "user" });
    }
    if (payload.type === "agent_message" && typeof payload.message === "string") {
      texts.push({ text: payload.message, role: "assistant" });
    }
  }
  return texts;
}

function iterPiTexts(entry) {
  if (entry.type !== "message") return [];
  const texts = [];
  const message = entry.message || {};
  const role = message.role === "user" || message.role === "assistant" ? message.role : "tool";
  for (const item of message.content || []) {
    if (item.type === "text" && typeof item.text === "string") {
      texts.push({ text: item.text, role });
    }
    if (item.type === "toolCall") {
      texts.push(summarizeToolAction(item.name, item.arguments));
    }
  }
  return texts;
}

function iterClaudeTexts(entry) {
  const texts = [];
  if (entry.type === "user" && !entry.isMeta) {
    const c = entry.message?.content;
    if (typeof c === "string") {
      texts.push({ text: c, role: "user" });
    } else if (Array.isArray(c)) {
      for (const item of c) {
        if (item.type === "text" && typeof item.text === "string") {
          texts.push({ text: item.text, role: "user" });
        }
        if (item.type === "tool_result") {
          const rc = item.content;
          if (typeof rc === "string") texts.push({ text: rc, role: "tool" });
          else if (Array.isArray(rc)) {
            for (const ri of rc) {
              if (ri.type === "text" && typeof ri.text === "string") {
                texts.push({ text: ri.text, role: "tool" });
              }
            }
          }
        }
      }
    }
  }
  if (entry.type === "assistant") {
    for (const item of entry.message?.content || []) {
      if (item.type === "text" && typeof item.text === "string") {
        texts.push({ text: item.text, role: "assistant" });
      }
      if (item.type === "tool_use") {
        texts.push(summarizeToolAction(item.name, item.input));
      }
    }
  }
  return texts;
}

function safeJsonParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider searches: list -> prune -> prefilter -> parse survivors.

function searchCodex(results, matcher, args, excludedPaths, stats) {
  const allFiles = walkJsonlFiles(CODEX_SESSIONS);
  const codexIndex = new Map();
  const excludedSessionIds = new Set();
  for (const { file } of allFiles) {
    const sessionId = sessionIdFromPath(file);
    if (excludedPaths.has(path.resolve(file))) {
      if (sessionId) excludedSessionIds.add(sessionId);
      continue;
    }
    if (sessionId) codexIndex.set(sessionId, file);
  }

  let candidates = allFiles.filter(
    (f) =>
      !excludedPaths.has(path.resolve(f.file)) &&
      !outsideDateWindow("codex", f, args.since, args.until),
  );
  candidates = filterEntriesByProject("codex", candidates, args.project);
  const candidatePaths = new Set(candidates.map((entry) => entry.file));

  // history.jsonl: small prompt index, always scanned in full.
  if (fs.existsSync(CODEX_HISTORY)) {
    for (const line of fs.readFileSync(CODEX_HISTORY, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const entry = safeJsonParse(line);
      if (!entry || typeof entry.text !== "string") continue;
      if (isNoise(entry.text)) continue;
      const sessionId = typeof entry.session_id === "string" ? entry.session_id : null;
      if (sessionId && excludedSessionIds.has(sessionId)) continue;
      const mappedPath = sessionId ? codexIndex.get(sessionId) : null;
      if (mappedPath && excludedPaths.has(path.resolve(mappedPath))) continue;
      const filePath = mappedPath || `codex-history:${sessionId || "unknown"}`;
      if (
        args.project &&
        !entry.text.toLowerCase().includes(args.project.toLowerCase()) &&
        !(mappedPath && candidatePaths.has(mappedPath))
      ) continue;
      addResult(results, {
        provider: "codex", filePath, sessionId,
        timestamp: isoFromEpoch(entry.ts), text: entry.text, matcher,
        maxSnippets: args.maxSnippets, role: "user",
        since: args.since, until: args.until, authored: args.authored,
        projectMatch: args.project,
      });
    }
  }

  stats.codex_pruned = candidates.length;

  const survivors = prefilterFiles(candidates.map((f) => f.file), matcher, args);
  stats.codex_parsed = survivors.length;
  const lineGate = makeLineGate(matcher, args);

  const processLine = (filePath, identity, project, line) => {
    const entry = safeJsonParse(line);
    if (!entry || entry.type === "session_meta") return;
    const timestamp = entry.timestamp || null;
    for (const { text, role } of iterCodexTexts(entry)) {
      if (isNoise(text)) continue;
      let searchableText = text;
      if (role === "tool" && !args.includeToolOutput) {
        if (!matcher.matches(text)) continue;
        searchableText = `tool-output match for query: ${matcher.query}`;
      }
      addResult(results, {
        provider: "codex", filePath, sessionId: identity.sessionId, timestamp, text: searchableText, matcher,
        maxSnippets: args.maxSnippets, role, project,
        since: args.since, until: args.until, authored: args.authored,
        parentSessionId: identity.parentSessionId, subagentId: identity.subagentId,
        projectMatch: args.project,
      });
    }
  };

  for (const filePath of survivors) {
    const identity = sessionIdentity("codex", filePath);
    let project = null;
    for (const line of readJsonlLines(filePath, stats)) {
      if (!line.trim()) continue;
      if (lineGate && !lineGate(line)) continue;
      const entry = safeJsonParse(line);
      if (!entry) continue;
      if (entry.type === "session_meta") {
        project = entry.payload?.cwd || null;
        continue;
      }
      if (project === null) project = projectFromHeadCached(filePath);
      processLine(filePath, identity, project, line);
    }
  }
}

function searchPi(results, matcher, args, excludedPaths, stats) {
  let candidates = walkJsonlFiles(PI_SESSIONS).filter(
    (f) =>
      !excludedPaths.has(path.resolve(f.file)) &&
      !outsideDateWindow("pi", f, args.since, args.until),
  );
  candidates = filterEntriesByProject("pi", candidates, args.project);
  stats.pi_pruned = candidates.length;

  const survivors = prefilterFiles(candidates.map((f) => f.file), matcher, args);
  stats.pi_parsed = survivors.length;
  const lineGate = makeLineGate(matcher, args);

  const processLine = (filePath, identity, project, line) => {
    const entry = safeJsonParse(line);
    if (!entry || entry.type === "session") return;
    const timestamp = entry.timestamp || entry.message?.timestamp || null;
    for (const { text, role } of iterPiTexts(entry)) {
      if (isNoise(text)) continue;
      let searchableText = text;
      if (role === "tool" && !args.includeToolOutput) {
        if (!matcher.matches(text)) continue;
        searchableText = `tool-output match for query: ${matcher.query}`;
      }
      addResult(results, {
        provider: "pi", filePath, sessionId: identity.sessionId, timestamp, text: searchableText, matcher,
        maxSnippets: args.maxSnippets, role, project,
        since: args.since, until: args.until, authored: args.authored,
        parentSessionId: identity.parentSessionId, subagentId: identity.subagentId,
        projectMatch: args.project,
      });
    }
  };

  for (const filePath of survivors) {
    const identity = sessionIdentity("pi", filePath);
    let project = null;
    for (const line of readJsonlLines(filePath, stats)) {
      if (!line.trim()) continue;
      if (lineGate && !lineGate(line)) continue;
      const entry = safeJsonParse(line);
      if (!entry) continue;
      if (entry.type === "session") {
        project = entry.cwd || null;
        continue;
      }
      if (project === null) project = projectFromHeadCached(filePath);
      processLine(filePath, identity, project, line);
    }
  }
}

function searchClaude(results, matcher, args, excludedPaths, stats) {
  let candidates = walkJsonlFiles(CLAUDE_PROJECTS).filter((f) => {
    if (excludedPaths.has(path.resolve(f.file))) return false;
    const isSubagent = f.file.includes(`${path.sep}subagents${path.sep}`);
    if (isSubagent && !args.includeSubagents) return false;
    if (outsideDateWindow("claude", f, args.since, args.until)) return false;
    return true;
  });
  candidates = filterEntriesByProject("claude", candidates, args.project);
  stats.claude_pruned = candidates.length;

  const survivors = prefilterFiles(candidates.map((f) => f.file), matcher, args);
  stats.claude_parsed = survivors.length;
  const lineGate = makeLineGate(matcher, args);

  const processFileLines = (filePath, lines) => {
    const isSubagent = filePath.includes(`${path.sep}subagents${path.sep}`);
    const identity = sessionIdentity("claude", filePath);
    let project = null;
    for (const line of lines) {
      if (!line.trim()) continue;
      if (lineGate && !lineGate(line)) continue;
      const entry = safeJsonParse(line);
      if (!entry) continue;
      if (!project && entry.cwd) project = entry.cwd;
      const timestamp = entry.timestamp || null;
      for (const { text, role } of iterClaudeTexts(entry)) {
        if (isNoise(text)) continue;
        let searchableText = text;
        if (role === "tool" && !args.includeToolOutput) {
          if (!matcher.matches(text)) continue;
          searchableText = `tool-output match for query: ${matcher.query}`;
        }
        addResult(results, {
          provider: "claude", filePath, sessionId: identity.sessionId, timestamp, text: searchableText, matcher,
          maxSnippets: args.maxSnippets, role,
          project: project || claudeProjectFromPath(filePath),
          isSubagent, since: args.since, until: args.until, authored: args.authored,
          parentSessionId: identity.parentSessionId, subagentId: identity.subagentId,
          projectMatch: args.project,
        });
      }
    }
  };

  for (const filePath of survivors) {
    processFileLines(filePath, readJsonlLines(filePath, stats));
  }
}

// ---------------------------------------------------------------------------
// Output.

function parentClaudePath(filePath, sessionId) {
  if (!filePath.includes(`${path.sep}subagents${path.sep}`) || !sessionId) return filePath;
  const projectDir = path.dirname(path.dirname(path.dirname(filePath)));
  return path.join(projectDir, `${sessionId}.jsonl`);
}

function collapseAuthorshipResults(results, args) {
  const items = [...results.values()];
  if (!args.authored) return items;
  const collapsed = new Map();

  for (const item of items) {
    const canCollapse = item.provider === "claude" && item.session_id;
    const key = canCollapse ? `claude:${item.session_id}` : `${item.provider}:${item.path}`;
    if (!collapsed.has(key)) {
      collapsed.set(key, {
        ...item,
        path: canCollapse ? parentClaudePath(item.path, item.session_id) : item.path,
        is_subagent: false,
        subagent_id: null,
        subagent_ids: [],
        has_subagent_hits: false,
        hits: 0,
        score: 0,
        authorship_score: 0,
        evidence: { user: 0, assistant: 0, edit: 0, commit: 0, action: 0, tool: 0 },
        snippets: [],
        touched_paths: [],
        project_matches: [],
        first_ts: null,
        last_ts: null,
        _snippetKeys: new Set(),
        _touchedPaths: new Set(),
        _subagentIds: new Set(),
      });
    }
    const target = collapsed.get(key);
    if (!item.is_subagent) {
      target.path = item.path;
      target.project = item.project || target.project;
    } else {
      target.has_subagent_hits = true;
      if (item.subagent_id) target._subagentIds.add(item.subagent_id);
    }
    target.hits += item.hits;
    target.score += item.score;
    target.authorship_score += item.authorship_score;
    for (const role of Object.keys(target.evidence)) {
      target.evidence[role] += item.evidence?.[role] || 0;
    }
    for (const projectMatch of item.project_matches || []) {
      if (!target.project_matches.includes(projectMatch)) target.project_matches.push(projectMatch);
    }
    for (const touchedPath of item.touched_paths || []) target._touchedPaths.add(touchedPath);
    for (const snippet of item.snippets || []) {
      const snippetKey = snippet.toLowerCase();
      if (!target._snippetKeys.has(snippetKey) && target.snippets.length < args.maxSnippets) {
        target._snippetKeys.add(snippetKey);
        target.snippets.push(snippet);
      }
    }
    if (item.first_ts && (!target.first_ts || item.first_ts < target.first_ts)) target.first_ts = item.first_ts;
    if (item.last_ts && (!target.last_ts || item.last_ts > target.last_ts)) target.last_ts = item.last_ts;
    target.has_continuation_summary ||= item.has_continuation_summary;
    target.touched_paths = [...target._touchedPaths].slice(0, 40);
    target.subagent_ids = [...target._subagentIds];
  }

  return [...collapsed.values()];
}

function sortResults(results, args) {
  return [...results].sort((left, right) => {
    if (args.authored && left.authorship_score !== right.authorship_score) {
      return right.authorship_score - left.authorship_score;
    }
    if (left.score !== right.score) return right.score - left.score;
    if (left.hits !== right.hits) return right.hits - left.hits;
    const leftTs = left.last_ts || "";
    const rightTs = right.last_ts || "";
    if (leftTs !== rightTs) return rightTs.localeCompare(leftTs);
    return left.path.localeCompare(right.path);
  });
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function resumeCommand(item) {
  if (!item.session_id) return null;
  const cwd = item.project ? `cd ${shellQuote(item.project)} && ` : "";
  if (item.provider === "codex") {
    return item.project
      ? `codex resume -C ${shellQuote(item.project)} ${shellQuote(item.session_id)}`
      : `codex resume ${shellQuote(item.session_id)}`;
  }
  if (item.provider === "claude") return `${cwd}claude --resume ${shellQuote(item.session_id)}`;
  if (item.provider === "pi") return `${cwd}pi --session ${shellQuote(item.session_id)}`;
  return null;
}

function printItem(item, index) {
  const tag = item.is_subagent ? `${item.provider}/subagent` : item.provider;
  console.log(`${index + 1}. [${tag}] ${item.path}`);
  if (item.session_id) console.log(`   Session ID: ${item.session_id}`);
  if (item.parent_session_id) console.log(`   Parent session: ${item.parent_session_id}`);
  if (item.subagent_id) console.log(`   Subagent: ${item.subagent_id}`);
  if (item.subagent_ids?.length > 0) console.log(`   Subagent hits: ${item.subagent_ids.join(", ")}`);
  if (item.project) console.log(`   Project: ${item.project}`);
  if (item.project_matches?.length > 0) console.log(`   Project matches: ${item.project_matches.join(", ")}`);
  console.log(`   Hits: ${item.hits}  Score: ${Math.round(item.score)}`);
  if (item.authorship_score > 0) console.log(`   Authorship score: ${Math.round(item.authorship_score)}`);
  if (item.touched_paths?.length > 0) console.log(`   Touched paths: ${item.touched_paths.join(", ")}`);
  const command = resumeCommand(item);
  if (command) console.log(`   Resume: ${command}`);
  if (item.first_ts) console.log(`   First: ${item.first_ts}`);
  if (item.last_ts && item.last_ts !== item.first_ts) console.log(`   Last: ${item.last_ts}`);
  if (item.snippets.length > 0) {
    console.log("   Snippets:");
    for (const snippet of item.snippets) console.log(`   - ${clip(snippet, 220)}`);
  }
  console.log("");
}

function printText(results, args) {
  console.log(`Query: ${args.query}`);
  console.log(`Provider: ${args.provider}`);
  if (args.since || args.until) console.log(`Window: ${args.since || "*"} .. ${args.until || "*"}`);
  if (args.project) console.log(`Project filter: ${args.project}`);
  console.log(`Matches: ${results.length}`);
  console.log("");

  if (results.length === 0) {
    console.log("No matches.");
    return;
  }

  if (args.groupByProject) {
    const groups = new Map();
    for (const item of results) {
      const key = item.project || "(unknown project)";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    let i = 0;
    for (const [project, items] of groups) {
      console.log(`## ${project}`);
      for (const item of items) printItem(item, i++);
    }
    return;
  }

  results.forEach((item, index) => printItem(item, index));
}

function main() {
  const started = Date.now();
  const args = parseArgs(process.argv.slice(2));
  const matcher = new Matcher(args.query, args);
  const results = new Map();
  const excludedPaths = new Set(args.excludePaths);
  const stats = {};

  if (!args.includeLatest) {
    const liveExcluded = [];
    for (const root of [CODEX_SESSIONS, PI_SESSIONS, CLAUDE_PROJECTS]) {
      for (const livePath of recentJsonlFiles(walkJsonlFiles(root))) {
        excludedPaths.add(livePath);
        liveExcluded.push(livePath);
      }
    }
    stats.live_sessions_excluded = liveExcluded.length;
  }

  if (args.provider === "all" || args.provider === "codex") {
    searchCodex(results, matcher, args, excludedPaths, stats);
  }
  if (args.provider === "all" || args.provider === "pi") {
    searchPi(results, matcher, args, excludedPaths, stats);
  }
  if (args.provider === "all" || args.provider === "claude") {
    searchClaude(results, matcher, args, excludedPaths, stats);
  }

  const ranked = sortResults(collapseAuthorshipResults(results, args), args).slice(0, args.limit);
  for (const item of ranked) {
    delete item._snippetKeys;
    delete item._touchedPaths;
    delete item._subagentIds;
    item.resume_command = resumeCommand(item);
  }

  if (args.stats) {
    stats.elapsed_ms = Date.now() - started;
    stats.prefilter = args.noPrefilter
      ? "disabled"
      : !hasRipgrep()
        ? "unavailable (rg missing)"
        : prefilterTokens(matcher)
          ? "ripgrep"
          : "skipped (regex or unsafe tokens)";
    console.error(`[stats] ${JSON.stringify(stats)}`);
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          query: args.query,
          provider: args.provider,
          since: args.since,
          until: args.until,
          project: args.project,
          authored: args.authored,
          include_tool_output: args.includeToolOutput,
          matches: ranked,
        },
        null,
        2,
      ),
    );
    return;
  }

  printText(ranked, args);
}

main();
