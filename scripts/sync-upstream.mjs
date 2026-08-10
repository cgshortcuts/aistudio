#!/usr/bin/env node
/**
 * Safely sync with the upstream NodeTool repository.
 *
 * - Requires remotes: origin (fork) and upstream (nodetool-ai/nodetool)
 * - Fetches upstream/main only (does not force-push or reset local work)
 * - Optionally merges upstream/main into the current branch (--merge)
 * - Always verifies web/src/custom still exists after the operation
 *
 * Usage:
 *   node scripts/sync-upstream.mjs
 *   node scripts/sync-upstream.mjs --merge
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CUSTOM_DIR = resolve(ROOT, "web/src/custom");
const UPSTREAM_URL = "https://github.com/nodetool-ai/nodetool.git";
const ORIGIN_HINT = "https://github.com/cgshortcuts/aistudio.git";
const wantMerge = process.argv.includes("--merge");

function run(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    ...options
  });
  return result;
}

function fail(message) {
  console.error(`sync:upstream failed: ${message}`);
  process.exit(1);
}

function assertCustomIntact(phase) {
  if (!existsSync(CUSTOM_DIR)) {
    fail(
      `web/src/custom is missing after ${phase}. Abort and restore the fork custom layer before continuing.`
    );
  }
}

if (!existsSync(resolve(ROOT, ".git"))) {
  fail(
    [
      "this directory is not a git repository.",
      "",
      "Run these once, then re-run npm run sync:upstream:",
      "  git init",
      `  git remote add origin ${ORIGIN_HINT}`,
      `  git remote add upstream ${UPSTREAM_URL}`,
      "  git fetch origin",
      "  git fetch upstream"
    ].join("\n")
  );
}

const remotes = run(["remote", "-v"]);
if (remotes.status !== 0) {
  fail(remotes.stderr || "could not list remotes");
}
const remoteText = remotes.stdout || "";
if (!/\bupstream\b/.test(remoteText)) {
  fail(
    `missing remote "upstream". Add it with:\n  git remote add upstream ${UPSTREAM_URL}`
  );
}
if (!/\borigin\b/.test(remoteText)) {
  fail(
    `missing remote "origin". Add it with:\n  git remote add origin ${ORIGIN_HINT}`
  );
}

assertCustomIntact("preflight");

console.log("Fetching upstream/main…");
const fetch = run(["fetch", "upstream", "main"], { stdio: "inherit" });
if (fetch.status !== 0) {
  fail("git fetch upstream main failed");
}

assertCustomIntact("fetch");

if (wantMerge) {
  console.log("Merging upstream/main into the current branch…");
  const merge = run(["merge", "--no-edit", "upstream/main"], {
    stdio: "inherit"
  });
  if (merge.status !== 0) {
    fail(
      "merge conflict or merge failed. Resolve conflicts carefully — keep web/src/custom/ and CUSTOM FORK mount markers."
    );
  }
  assertCustomIntact("merge");
  console.log("Merged upstream/main. Review CUSTOM FORK mounts if upstream touched those files.");
} else {
  const behind = run([
    "rev-list",
    "--left-right",
    "--count",
    "HEAD...upstream/main"
  ]);
  if (behind.status === 0) {
    const [ahead, behindCount] = (behind.stdout || "0\t0")
      .trim()
      .split(/\s+/);
    console.log(
      `Fetched upstream/main. Local is ${ahead} commit(s) ahead and ${behindCount} behind upstream/main.`
    );
  } else {
    console.log("Fetched upstream/main.");
  }
  console.log(
    "Custom mounts preserved (fetch-only). To merge: npm run sync:upstream -- --merge"
  );
}

assertCustomIntact("done");
console.log("OK: web/src/custom is intact.");
