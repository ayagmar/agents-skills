#!/usr/bin/env node
// Read-only cost/waste aggregation over Codex, Pi, and Claude Code session stores.
// Never prints message bodies; only metadata, counts, tokens, and truncated prompt fingerprints.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const HOME = os.homedir();
const ROOTS = {
  codex: path.join(HOME, ".codex", "sessions"),
  pi: path.join(HOME, ".pi", "agent", "sessions"),
  claude: path.join(HOME, ".claude", "projects"),
};

function usage() {
  console.error(
    "Usage: session_cost_report.mjs [--provider all|codex|pi|claude] [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--project SUBSTR] [--include-subagents] [--top N] [--json]",
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
    else if (c === "--json") a.json = true;
    else usage();
  }
  if (!["all", "codex", "pi", "claude"].includes(a.provider)) usage();
  if (!Number.isFinite(a.top) || a.top < 1) usage();
  return a;
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
      yield { file: cur, size: st.size, mtime: st.mtimeMs };
    }
  }
}

function inWindow(dateIso, since, until) {
  if (!dateIso) return true;
  const d = dateIso.slice(0, 10);
  if (since && d < since) return false;
  if (until && d > until) return false;
  return true;
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

function newSession(provider, file, size) {
  return {
    provider,
    path: file,
    bytes: size,
    project: null,
    first_ts: null,
    last_ts: null,
    user_messages: 0,
    assistant_messages: 0,
    tool_results: 0,
    compactions: 0,
    models: new Set(),
    input_tokens: 0,
    cached_tokens: 0,
    cache_write_tokens: 0,
    output_tokens: 0,
    cost_usd: 0,
    has_cost: false,
    prompt_fps: [],
    is_subagent: false,
  };
}

function noteTs(s, ts) {
  if (!ts) return;
  if (!s.first_ts || ts < s.first_ts) s.first_ts = ts;
  if (!s.last_ts || ts > s.last_ts) s.last_ts = ts;
}

// --- Codex: token_count events carry cumulative usage; take max of totals.
function parseCodex(file, size) {
  const s = newSession("codex", file, size);
  let maxTotals = null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const e = safeParse(line);
    if (!e) continue;
    noteTs(s, e.timestamp || null);
    if (e.type === "session_meta") {
      s.project = e.payload?.cwd || e.payload?.payload?.cwd || null;
      continue;
    }
    if (e.type === "compacted") s.compactions += 1;
    if (e.type === "turn_context" && e.payload?.model) s.models.add(e.payload.model);
    const p = e.payload || {};
    if (e.type === "event_msg") {
      if (p.type === "user_message" && typeof p.message === "string") {
        s.user_messages += 1;
        s.prompt_fps.push(fp(p.message));
      }
      if (p.type === "agent_message") s.assistant_messages += 1;
      if (p.type === "token_count" && p.info?.total_token_usage) {
        const t = p.info.total_token_usage;
        if (!maxTotals || (t.total_tokens || 0) > (maxTotals.total_tokens || 0)) maxTotals = t;
      }
    }
    if (e.type === "response_item" && p.type === "function_call_output") s.tool_results += 1;
  }
  if (maxTotals) {
    s.input_tokens = (maxTotals.input_tokens || 0) - (maxTotals.cached_input_tokens || 0);
    s.cached_tokens = maxTotals.cached_input_tokens || 0;
    s.output_tokens = maxTotals.output_tokens || 0;
  }
  return s;
}

// --- Pi: per-assistant-message usage with direct cost.
function parsePi(file, size) {
  const s = newSession("pi", file, size);
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const e = safeParse(line);
    if (!e) continue;
    noteTs(s, e.timestamp || null);
    if (e.type === "session") s.project = e.cwd || null;
    if (e.type === "compaction") s.compactions += 1;
    if (e.type === "model_change" && e.modelId) s.models.add(e.modelId);
    if (e.type !== "message") continue;
    const m = e.message || {};
    if (m.role === "user") {
      const texts = (m.content || [])
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text);
      if (texts.length) {
        s.user_messages += 1;
        s.prompt_fps.push(fp(texts.join(" ")));
      }
    }
    if (m.role === "assistant") {
      s.assistant_messages += 1;
      const u = m.usage;
      if (u) {
        s.input_tokens += u.input || 0;
        s.cached_tokens += u.cacheRead || 0;
        s.cache_write_tokens += u.cacheWrite || 0;
        s.output_tokens += u.output || 0;
        if (u.cost?.total) {
          s.cost_usd += u.cost.total;
          s.has_cost = true;
        }
      }
    }
    if (m.role === "toolResult" || m.role === "tool") s.tool_results += 1;
  }
  return s;
}

// --- Claude Code: assistant entries carry per-iteration usage; sum them.
function parseClaude(file, size) {
  const s = newSession("claude", file, size);
  s.is_subagent = file.includes(`${path.sep}subagents${path.sep}`);
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const e = safeParse(line);
    if (!e) continue;
    noteTs(s, e.timestamp || null);
    if (!s.project && e.cwd) s.project = e.cwd;
    if (e.type === "user" && !e.isMeta) {
      const c = e.message?.content;
      if (typeof c === "string") {
        if (!c.startsWith("<")) {
          s.user_messages += 1;
          s.prompt_fps.push(fp(c));
        }
      } else if (Array.isArray(c)) {
        if (c.some((i) => i.type === "tool_result")) s.tool_results += 1;
        const texts = c.filter((i) => i.type === "text").map((i) => i.text || "");
        if (texts.length) {
          s.user_messages += 1;
          s.prompt_fps.push(fp(texts.join(" ")));
        }
      }
    }
    if (e.type === "assistant") {
      s.assistant_messages += 1;
      const m = e.message || {};
      if (m.model) s.models.add(m.model);
      const u = m.usage;
      if (u) {
        s.input_tokens += u.input_tokens || 0;
        s.cached_tokens += u.cache_read_input_tokens || 0;
        s.cache_write_tokens += u.cache_creation_input_tokens || 0;
        s.output_tokens += u.output_tokens || 0;
      }
    }
  }
  return s;
}

function finalize(s) {
  const total = s.input_tokens + s.cached_tokens + s.cache_write_tokens + s.output_tokens;
  const denom = s.input_tokens + s.cached_tokens;
  const fpCounts = new Map();
  for (const f of s.prompt_fps) fpCounts.set(f, (fpCounts.get(f) || 0) + 1);
  const repeated = [...fpCounts.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
  return {
    provider: s.provider,
    path: s.path,
    project: s.project,
    is_subagent: s.is_subagent,
    first_ts: s.first_ts,
    last_ts: s.last_ts,
    bytes: s.bytes,
    user_messages: s.user_messages,
    assistant_messages: s.assistant_messages,
    tool_results: s.tool_results,
    compactions: s.compactions,
    models: [...s.models],
    tokens: {
      fresh_input: s.input_tokens,
      cache_read: s.cached_tokens,
      cache_write: s.cache_write_tokens,
      output: s.output_tokens,
      total,
    },
    cache_hit_ratio: denom > 0 ? Number((s.cached_tokens / denom).toFixed(3)) : null,
    cost_usd: s.has_cost ? Number(s.cost_usd.toFixed(4)) : null,
    repeated_prompt_count: repeated,
    prompt_fingerprints: s.prompt_fps,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const providers =
    args.provider === "all" ? ["codex", "pi", "claude"] : [args.provider];
  const sessions = [];
  for (const p of providers) {
    for (const { file, size } of walkJsonl(ROOTS[p])) {
      if (p === "claude" && !args.includeSubagents && file.includes(`${path.sep}subagents${path.sep}`)) continue;
      let s;
      try {
        s = p === "codex" ? parseCodex(file, size) : p === "pi" ? parsePi(file, size) : parseClaude(file, size);
      } catch {
        continue;
      }
      const f = finalize(s);
      if (!inWindow(f.first_ts || f.last_ts, args.since, args.until)) continue;
      if (args.project && !(f.project || "").includes(args.project) && !f.path.includes(args.project)) continue;
      sessions.push(f);
    }
  }

  // Cross-session duplicate prompt detection (same fingerprint in 2+ sessions).
  const crossFp = new Map();
  for (const s of sessions) {
    for (const f of new Set(s.prompt_fingerprints)) {
      if (!crossFp.has(f)) crossFp.set(f, []);
      crossFp.get(f).push(s.path);
    }
  }
  const duplicatePrompts = [...crossFp.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([fingerprint, paths]) => ({ fingerprint, sessions: paths }))
    .sort((a, b) => b.sessions.length - a.sessions.length)
    .slice(0, 20);

  for (const s of sessions) delete s.prompt_fingerprints;

  const totals = { sessions: sessions.length, tokens: 0, output: 0, cache_read: 0, fresh_input: 0, cost_usd: 0, compactions: 0 };
  for (const s of sessions) {
    totals.tokens += s.tokens.total;
    totals.output += s.tokens.output;
    totals.cache_read += s.tokens.cache_read;
    totals.fresh_input += s.tokens.fresh_input;
    totals.cost_usd += s.cost_usd || 0;
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
    filters: { provider: args.provider, since: args.since, until: args.until, project: args.project, include_subagents: args.includeSubagents },
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

  console.log(`Sessions: ${totals.sessions}  Total tokens: ${totals.tokens.toLocaleString()}  Cost (where recorded): $${totals.cost_usd}`);
  console.log(`Fresh input: ${totals.fresh_input.toLocaleString()}  Cache read: ${totals.cache_read.toLocaleString()}  Output: ${totals.output.toLocaleString()}  Compactions: ${totals.compactions}`);
  console.log("\nHeaviest sessions:");
  for (const s of heaviest) {
    console.log(`- [${s.provider}] ${s.tokens.total.toLocaleString()} tok${s.cost_usd !== null ? ` $${s.cost_usd}` : ""} cache=${s.cache_hit_ratio ?? "n/a"} compactions=${s.compactions} ${s.first_ts ? s.first_ts.slice(0, 10) : "?"} ${s.path}`);
  }
  if (worstCache.length) {
    console.log("\nWorst cache hit ratio (>100k tokens):");
    for (const s of worstCache) console.log(`- [${s.provider}] cache=${s.cache_hit_ratio} ${s.tokens.total.toLocaleString()} tok ${s.path}`);
  }
  if (retryHeavy.length) {
    console.log("\nRepeated identical prompts within a session (retry/duplication signal):");
    for (const s of retryHeavy) console.log(`- [${s.provider}] repeats=${s.repeated_prompt_count} ${s.path}`);
  }
  if (duplicatePrompts.length) {
    console.log("\nSame prompt across multiple sessions (duplicate-session signal):");
    for (const d of duplicatePrompts.slice(0, 5)) console.log(`- fp=${d.fingerprint} in ${d.sessions.length} sessions (first: ${d.sessions[0]})`);
  }
}

main();
