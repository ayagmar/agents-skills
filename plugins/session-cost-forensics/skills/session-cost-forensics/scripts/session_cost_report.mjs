#!/usr/bin/env node
// Read-only cost/waste report over Codex, Pi, and Claude Code sessions.
// Tokens, cost, and models per session come from `llm-usage session --json` (llm-usage-metrics);
// this script adds what that report lacks: compactions, prompt repeats, duplicate sessions,
// tool-result counts, and Claude subagent transcripts, read from the session files.
// Never prints message bodies; only metadata, counts, tokens, and truncated prompt fingerprints.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const LLM_USAGE_PACKAGE = "llm-usage-metrics@latest";
const HOME = os.homedir();
// The same default directories llm-usage-metrics reads, passed to it explicitly so both read
// the same files: CODEX_HOME and a comma-separated CLAUDE_CONFIG_DIR replace the home defaults.
const CODEX_HOME = process.env.CODEX_HOME?.trim() || path.join(HOME, ".codex");
const CLAUDE_CONFIG_DIRS = (process.env.CLAUDE_CONFIG_DIR ?? "").split(",").map((d) => d.trim()).filter(Boolean);
const ROOTS = {
  codex: [path.join(CODEX_HOME, "sessions")],
  pi: [path.join(HOME, ".pi", "agent", "sessions"), path.join(HOME, ".omp", "agent", "sessions")],
  claude: (CLAUDE_CONFIG_DIRS.length ? CLAUDE_CONFIG_DIRS : [path.join(HOME, ".claude")]).flatMap((d) => [
    path.join(d, "projects"),
    path.join(d, "transcripts"),
  ]),
};
const DIR_FLAGS = { codex: "--codex-dir", pi: "--pi-dir", claude: "--claude-dir" };

function usage() {
  console.error(
    "Usage: session_cost_report.mjs [--provider all|codex|pi|claude] [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--project SUBSTR] [--include-subagents] [--top N] [--pricing-offline] [--json]",
  );
  process.exit(1);
}

function parseArgs(argv) {
  const a = {
    provider: "all",
    since: null,
    until: null,
    project: null,
    includeSubagents: false,
    top: 10,
    pricingOffline: false,
    json: false,
  };
  const parts = [...argv];
  while (parts.length) {
    const c = parts.shift();
    if (c === "--provider") a.provider = parts.shift() || "";
    else if (c === "--since") a.since = parts.shift() || null;
    else if (c === "--until") a.until = parts.shift() || null;
    else if (c === "--project") a.project = parts.shift() || null;
    else if (c === "--include-subagents") a.includeSubagents = true;
    else if (c === "--top") a.top = Number(parts.shift() || "10");
    else if (c === "--pricing-offline") a.pricingOffline = true;
    else if (c === "--json") a.json = true;
    else usage();
  }
  if (!["all", "codex", "pi", "claude"].includes(a.provider)) usage();
  if (!Number.isFinite(a.top) || a.top < 1) usage();
  for (const d of [a.since, a.until]) if (d !== null && !/^\d{4}-\d{2}-\d{2}$/.test(d)) usage();
  return a;
}

// --- Tokens, cost, and models from llm-usage-metrics, keyed by source and session id.
// The event store is off so the run writes nothing besides the pricing cache, and only
// this machine is counted, without syncing other machines over ssh.
function loadUsageRows(args, roots) {
  const providers = Object.keys(roots).filter((p) => roots[p].length);
  if (!providers.length) return [];
  const cliArgs = [
    "--yes",
    LLM_USAGE_PACKAGE,
    "session",
    "--json",
    "--quiet",
    "--top",
    "0",
    "--source",
    providers.join(","),
    "--machine",
    "local",
    "--no-sync",
  ];
  for (const p of providers) for (const root of roots[p]) cliArgs.push(DIR_FLAGS[p], root);
  if (args.since) cliArgs.push("--since", args.since);
  if (args.until) cliArgs.push("--until", args.until);
  if (args.pricingOffline) cliArgs.push("--pricing-offline");
  const stdout = execFileSync("npx", cliArgs, {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
    shell: process.platform === "win32",
    env: { ...process.env, LLM_USAGE_EVENT_STORE: "0", LLM_USAGE_SKIP_UPDATE_CHECK: "1", npm_config_update_notifier: "false" },
  });
  const report = JSON.parse(stdout);
  if (report.schemaVersion !== 1 || report.report !== "session" || !Array.isArray(report.data)) {
    throw new Error(`unexpected llm-usage output (schemaVersion ${report.schemaVersion}, report ${report.report})`);
  }
  return report.data.filter((r) => r.rowType === "session");
}

function* walkJsonl(root) {
  if (!fs.existsSync(root)) return;
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let st;
    try {
      st = fs.statSync(cur);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      for (const e of fs.readdirSync(cur)) stack.push(path.join(cur, e));
    } else if (cur.endsWith(".jsonl")) {
      yield cur;
    }
  }
}

function safeParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function fp(text) {
  return crypto
    .createHash("sha1")
    .update(text.replace(/\s+/g, " ").trim().toLowerCase())
    .digest("hex")
    .slice(0, 12);
}

// Session ids follow llm-usage-metrics: the id the file records, else one derived from the file name.
function fallbackSessionId(provider, file) {
  const base = path.basename(file, ".jsonl");
  if (provider !== "pi") return base;
  const sep = base.lastIndexOf("_");
  return sep === -1 ? base : base.slice(sep + 1);
}

// --- Structure the usage report does not carry: prompts, compactions, tool results.
function scanFile(provider, file) {
  const s = {
    session_id: null,
    path: file,
    project: null,
    is_subagent: provider === "claude" && file.includes(`${path.sep}subagents${path.sep}`),
    user_messages: 0,
    tool_results: 0,
    compactions: 0,
    prompt_fps: [],
  };
  const claudeIds = new Set();
  const prompt = (text) => {
    s.user_messages += 1;
    s.prompt_fps.push(fp(text));
  };
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const e = safeParse(line);
    if (!e) continue;
    const p = e.payload || {};
    if (provider === "codex") {
      if (e.type === "session_meta") {
        s.session_id ??= p.id || null;
        s.project ??= p.cwd || null;
      }
      if (e.type === "compacted") s.compactions += 1;
      if (e.type === "event_msg" && p.type === "user_message" && typeof p.message === "string") prompt(p.message);
      if (e.type === "response_item" && p.type === "function_call_output") s.tool_results += 1;
    } else if (provider === "pi") {
      if (e.type === "session") {
        s.session_id ??= e.id || null;
        s.project ??= e.cwd || null;
      }
      if (e.type === "compaction") s.compactions += 1;
      if (e.type !== "message") continue;
      const m = e.message || {};
      if (m.role === "user") {
        const texts = (m.content || []).filter((c) => c.type === "text" && typeof c.text === "string").map((c) => c.text);
        if (texts.length) prompt(texts.join(" "));
      }
      if (m.role === "toolResult" || m.role === "tool") s.tool_results += 1;
    } else {
      if (e.sessionId) claudeIds.add(e.sessionId);
      s.project ??= e.cwd || null;
      if (e.type === "system" && e.subtype === "compact_boundary") s.compactions += 1;
      if (e.type !== "user" || e.isMeta || e.isCompactSummary) continue;
      const c = e.message?.content;
      if (typeof c === "string") {
        if (!c.startsWith("<")) prompt(c);
      } else if (Array.isArray(c)) {
        if (c.some((i) => i.type === "tool_result")) s.tool_results += 1;
        const texts = c.filter((i) => i.type === "text").map((i) => i.text || "");
        if (texts.length) prompt(texts.join(" "));
      }
    }
  }
  // Claude names a transcript after its session, but a resumed one starts with lines copied
  // under the earlier session's id, and subagent transcripts carry only their parent's id.
  if (provider === "claude") {
    const base = path.basename(file, ".jsonl");
    s.session_id = claudeIds.has(base) ? base : ([...claudeIds][0] ?? null);
  }
  s.session_id ??= fallbackSessionId(provider, file);
  return s;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const providers = args.provider === "all" ? ["codex", "pi", "claude"] : [args.provider];
  // llm-usage rejects a directory flag naming a missing directory.
  const roots = Object.fromEntries(providers.map((p) => [p, ROOTS[p].filter((root) => fs.existsSync(root))]));

  // One llm-usage session can span several files (Claude subagent transcripts, resumed or forked files).
  const files = new Map();
  for (const p of providers) {
    for (const file of roots[p].flatMap((root) => [...walkJsonl(root)])) {
      let s;
      try {
        s = scanFile(p, file);
      } catch {
        continue;
      }
      if (s.is_subagent && !args.includeSubagents) continue;
      const key = `${p}\0${s.session_id}`;
      if (!files.has(key)) files.set(key, []);
      files.get(key).push(s);
    }
  }

  let rows;
  try {
    rows = loadUsageRows(args, roots);
  } catch (err) {
    console.error(`session_cost_report: npx ${LLM_USAGE_PACKAGE} session --json failed: ${err.message}`);
    process.exit(1);
  }
  const sessions = [];
  for (const row of rows) {
    const scans = (files.get(`${row.source}\0${row.sessionId}`) || []).sort(
      (a, b) => a.is_subagent - b.is_subagent || a.path.localeCompare(b.path),
    );
    const project = row.repoRoot || scans.find((s) => s.project)?.project || null;
    if (args.project && ![project || "", ...scans.map((s) => s.path)].some((v) => v.includes(args.project))) continue;
    const fps = scans.flatMap((s) => s.prompt_fps);
    const fpCounts = new Map();
    for (const f of fps) fpCounts.set(f, (fpCounts.get(f) || 0) + 1);
    const denom = row.inputTokens + row.cacheReadTokens;
    sessions.push({
      provider: row.source,
      session_id: row.sessionId,
      path: scans[0]?.path ?? null,
      other_paths: scans.slice(1).map((s) => s.path),
      project,
      subagent_transcripts: scans.filter((s) => s.is_subagent).length,
      first_ts: row.firstActivity,
      last_ts: row.lastActivity,
      usage_events: row.eventCount,
      user_messages: scans.reduce((n, s) => n + s.user_messages, 0),
      tool_results: scans.reduce((n, s) => n + s.tool_results, 0),
      compactions: scans.reduce((n, s) => n + s.compactions, 0),
      models: row.models,
      tokens: {
        fresh_input: row.inputTokens,
        cache_read: row.cacheReadTokens,
        cache_write: row.cacheWriteTokens,
        output: row.outputTokens,
        reasoning: row.reasoningTokens,
        total: row.totalTokens,
      },
      cache_hit_ratio: denom > 0 ? Number((row.cacheReadTokens / denom).toFixed(3)) : null,
      cost_usd: row.costUsd === undefined ? null : Number(row.costUsd.toFixed(4)),
      cost_incomplete: row.costIncomplete === true,
      repeated_prompt_count: [...fpCounts.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0),
      prompt_fingerprints: fps,
    });
  }

  // Cross-session duplicate prompt detection (same fingerprint in 2+ sessions).
  const crossFp = new Map();
  for (const s of sessions) {
    for (const f of new Set(s.prompt_fingerprints)) {
      if (!crossFp.has(f)) crossFp.set(f, []);
      crossFp.get(f).push(s.path ?? `${s.provider}:${s.session_id}`);
    }
  }
  const duplicatePrompts = [...crossFp.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([fingerprint, paths]) => ({ fingerprint, sessions: paths }))
    .sort((a, b) => b.sessions.length - a.sessions.length)
    .slice(0, 20);

  for (const s of sessions) delete s.prompt_fingerprints;

  const totals = { sessions: sessions.length, tokens: 0, output: 0, cache_read: 0, fresh_input: 0, cost_usd: 0, cost_incomplete: false, compactions: 0 };
  for (const s of sessions) {
    totals.tokens += s.tokens.total;
    totals.output += s.tokens.output;
    totals.cache_read += s.tokens.cache_read;
    totals.fresh_input += s.tokens.fresh_input;
    totals.cost_usd += s.cost_usd || 0;
    totals.cost_incomplete ||= s.cost_usd === null || s.cost_incomplete;
    totals.compactions += s.compactions;
  }
  totals.cost_usd = Number(totals.cost_usd.toFixed(2));

  const heaviest = [...sessions].sort((a, b) => b.tokens.total - a.tokens.total).slice(0, args.top);
  const worstCache = sessions
    .filter((s) => s.cache_hit_ratio !== null && s.tokens.total > 100000)
    .sort((a, b) => a.cache_hit_ratio - b.cache_hit_ratio)
    .slice(0, args.top);
  const retryHeavy = sessions
    .filter((s) => s.repeated_prompt_count > 0)
    .sort((a, b) => b.repeated_prompt_count - a.repeated_prompt_count)
    .slice(0, args.top);

  const out = {
    filters: { provider: args.provider, since: args.since, until: args.until, project: args.project, include_subagents: args.includeSubagents, pricing_offline: args.pricingOffline },
    usage_source: LLM_USAGE_PACKAGE,
    totals,
    heaviest_sessions: heaviest,
    worst_cache_sessions: worstCache,
    repeated_prompt_sessions: retryHeavy,
    cross_session_duplicate_prompts: duplicatePrompts,
  };

  if (args.json) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const cost = (usd, partial) => (usd === null ? "-" : `${partial ? "~" : ""}$${usd}`);
  const where = (s) => s.path ?? `${s.provider}:${s.session_id}`;
  console.log(`Sessions: ${totals.sessions}  Total tokens: ${totals.tokens.toLocaleString()}  Cost: ${cost(totals.cost_usd, totals.cost_incomplete)}`);
  console.log(`Fresh input: ${totals.fresh_input.toLocaleString()}  Cache read: ${totals.cache_read.toLocaleString()}  Output: ${totals.output.toLocaleString()}  Compactions: ${totals.compactions}`);
  console.log("\nHeaviest sessions:");
  for (const s of heaviest) {
    const extra = s.other_paths.length ? ` (+${s.other_paths.length} files)` : "";
    console.log(`- [${s.provider}] ${s.tokens.total.toLocaleString()} tok ${cost(s.cost_usd, s.cost_incomplete)} cache=${s.cache_hit_ratio ?? "n/a"} compactions=${s.compactions} ${s.first_ts.slice(0, 10)} ${where(s)}${extra}`);
  }
  if (worstCache.length) {
    console.log("\nWorst cache hit ratio (>100k tokens):");
    for (const s of worstCache) console.log(`- [${s.provider}] cache=${s.cache_hit_ratio} ${s.tokens.total.toLocaleString()} tok ${where(s)}`);
  }
  if (retryHeavy.length) {
    console.log("\nRepeated identical prompts within a session (retry/duplication signal):");
    for (const s of retryHeavy) console.log(`- [${s.provider}] repeats=${s.repeated_prompt_count} ${where(s)}`);
  }
  if (duplicatePrompts.length) {
    console.log("\nSame prompt across multiple sessions (duplicate-session signal):");
    for (const d of duplicatePrompts.slice(0, 5)) console.log(`- fp=${d.fingerprint} in ${d.sessions.length} sessions (first: ${d.sessions[0]})`);
  }
}

main();
