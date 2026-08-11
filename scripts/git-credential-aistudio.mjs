#!/usr/bin/env node
/**
 * Git credential helper for this fork.
 * Always uses the cgshortcuts GitHub CLI token, even when another
 * gh account is active on the machine.
 *
 * Git invokes: node git-credential-aistudio.mjs <get|store|erase>
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const ACCOUNT = "cgshortcuts";
const HOST = "github.com";
const GH_EXE_WIN = "C:\\Program Files\\GitHub CLI\\gh.exe";

const action = process.argv[2] ?? "";

if (action !== "get") {
  process.exit(0);
}

const fields = parseCredentialFields(readFileSync(0, "utf8"));
if (fields.host && fields.host !== HOST) {
  process.exit(0);
}

const token = readToken();
if (!token) {
  process.stderr.write(
    `aistudio git credential: no GitHub token for ${ACCOUNT}.\n` +
      `Log in once: gh auth login\n` +
      `Confirm ${ACCOUNT} is listed in: gh auth status\n`
  );
  process.exit(1);
}

process.stdout.write(
  `protocol=https\nhost=${HOST}\nusername=${ACCOUNT}\npassword=${token}\n`
);

function parseCredentialFields(stdin) {
  const fields = {};
  for (const line of stdin.split(/\r?\n/)) {
    if (!line) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    fields[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return fields;
}

function resolveGh() {
  if (process.env.GH_PATH && existsSync(process.env.GH_PATH)) {
    return process.env.GH_PATH;
  }
  if (process.platform === "win32" && existsSync(GH_EXE_WIN)) {
    return GH_EXE_WIN;
  }
  return "gh";
}

function readToken() {
  const result = spawnSync(
    resolveGh(),
    ["auth", "token", "--user", ACCOUNT, "--hostname", HOST],
    {
      encoding: "utf8",
      windowsHide: true
    }
  );
  if (result.status !== 0) {
    return "";
  }
  return (result.stdout || "").trim();
}
