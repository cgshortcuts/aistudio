#!/usr/bin/env node
/**
 * Pin this workspace to always publish to cgshortcuts/aistudio.
 * Safe to re-run; does not touch commits or the working tree.
 *
 * Does not run `gh auth switch`. Other GitHub accounts can stay active;
 * this repo uses a local credential helper that always sends the
 * cgshortcuts token.
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ORIGIN = "https://cgshortcuts@github.com/cgshortcuts/aistudio.git";
const UPSTREAM = "https://github.com/nodetool-ai/nodetool.git";
const ACCOUNT = "cgshortcuts";
const HELPER_SCRIPT = resolve(ROOT, "scripts/git-credential-aistudio.mjs");
const quiet = process.argv.includes("--quiet");

function git(args) {
  return spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function log(message) {
  if (!quiet) {
    console.log(message);
  }
}

function bashQuote(value) {
  const normalized = value.replace(/\\/g, "/");
  return `'${normalized.replace(/'/g, `'\\''`)}'`;
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
git(["config", "--local", "credential.https://github.com.username", ACCOUNT]);
git(["config", "--local", "github.user", ACCOUNT]);

const helperCmd = `!${bashQuote(process.execPath)} ${bashQuote(HELPER_SCRIPT)}`;
git(["config", "--local", "--unset-all", "credential.https://github.com.helper"]);
git(["config", "--local", "credential.https://github.com.helper", ""]);
git(["config", "--local", "--add", "credential.https://github.com.helper", helperCmd]);

installPrePushHook();

const tokenCheck = spawnSync(
  process.execPath,
  [HELPER_SCRIPT, "get"],
  {
    cwd: ROOT,
    encoding: "utf8",
    input: "protocol=https\nhost=github.com\nusername=cgshortcuts\n\n",
    windowsHide: true
  }
);
if (tokenCheck.status !== 0) {
  console.warn(
    `No GitHub token for ${ACCOUNT}. git push will fail until you run:\n` +
      `  gh auth login\n` +
      `Then confirm ${ACCOUNT} is listed in: gh auth status`
  );
  if (tokenCheck.stderr) {
    console.warn(tokenCheck.stderr.trim());
  }
}

log(`origin   → ${ORIGIN}`);
log(`upstream → ${UPSTREAM}`);
log(`git user → ${ACCOUNT}`);
log("This workspace is pinned to publish to cgshortcuts/aistudio.");
log("Pushes use the cgshortcuts token even if another gh account is active.");

function installPrePushHook() {
  const hookPath = resolve(ROOT, ".git/hooks/pre-push");
  const nodePath = process.execPath.replace(/\\/g, "/");
  const scriptPath = resolve(ROOT, "scripts/ensure-git-remotes.mjs").replace(
    /\\/g,
    "/"
  );
  const hook = `#!/bin/sh
# Installed by scripts/ensure-git-remotes.mjs
"${nodePath}" "${scriptPath}" --quiet
`;
  writeFileSync(hookPath, hook, { encoding: "utf8" });
}
