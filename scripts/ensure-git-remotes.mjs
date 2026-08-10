#!/usr/bin/env node
/**
 * Pin this workspace to always publish to cgshortcuts/aistudio.
 * Safe to re-run; does not touch commits or the working tree.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ORIGIN = "https://cgshortcuts@github.com/cgshortcuts/aistudio.git";
const UPSTREAM = "https://github.com/nodetool-ai/nodetool.git";
const ACCOUNT = "cgshortcuts";

function git(args) {
  return spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

if (!existsSync(resolve(ROOT, ".git"))) {
  console.error("Not a git repository. Run git init first.");
  process.exit(1);
}

const remotes = git(["remote"]);
const remoteNames = new Set(
  (remotes.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
);

if (remoteNames.has("origin")) {
  git(["remote", "set-url", "origin", ORIGIN]);
} else {
  git(["remote", "add", "origin", ORIGIN]);
}

if (remoteNames.has("upstream")) {
  git(["remote", "set-url", "upstream", UPSTREAM]);
} else {
  git(["remote", "add", "upstream", UPSTREAM]);
}

git(["config", "--local", "credential.username", ACCOUNT]);
git(["config", "--local", "github.user", ACCOUNT]);

const switchResult = spawnSync("gh", ["auth", "switch", "--user", ACCOUNT], {
  cwd: ROOT,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});
if (switchResult.status !== 0) {
  console.warn(
    `Could not switch gh account to ${ACCOUNT}. Run: gh auth switch --user ${ACCOUNT}`
  );
  if (switchResult.stderr) {
    console.warn(switchResult.stderr.trim());
  }
}

console.log(`origin   → ${ORIGIN}`);
console.log(`upstream → ${UPSTREAM}`);
console.log(`git user → ${ACCOUNT}`);
console.log("This workspace is pinned to publish to cgshortcuts/aistudio.");
