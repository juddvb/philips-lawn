#!/usr/bin/env node
// Hand a scoped piece of work, or a question, to OpenAI's Codex agent from inside a Claude Code session, so the
// lead never pastes anything between apps. Codex reads AGENTS.md (the same file as CLAUDE.md) by itself; this
// wrapper adds the role and the report shape, runs `codex exec`, and prints the agent's last message.
//
//   node tools/codex.mjs build --task "<what to do>" [--piece "<area>"] [--model gpt-5.3-codex]
//   node tools/codex.mjs ask   "<a question about this repository>"
//   node tools/codex.mjs <mode> ... --dry-run          print the command and the prompt, run nothing
//
// Where the key comes from. In a Claude cloud session the OpenAI key is a network secret on the environment: the
// proxy adds it to every request to api.openai.com, so OPENAI_API_KEY only has to be SET, not real; this wrapper
// sets the placeholder "sk-proxy-injected" when the variable is empty and no `codex login` has happened. On the
// owner's own computer, run `codex login` once (the ChatGPT plan) or export OPENAI_API_KEY.
//
// Codex is not a project dependency. If it is not installed, the wrapper installs it once per machine
// (`npm i -g @openai/codex`). Its sandbox stays on: workspace-write with network to localhost for build (tests
// may start a server within one command), read-only for ask. Never run it unsandboxed. A process that outlives
// one command does not survive inside the sandbox, so a build must start and stop what it needs within a command.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const mode = args.shift();
const flags = {};
const words = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    if (['dry-run', 'help'].includes(k)) flags[k] = true;
    else flags[k] = args[++i];
  } else words.push(a);
}
const usage = () => {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(mode ? 0 : 2);
};
if (!mode || flags.help || !['build', 'ask'].includes(mode)) usage();

const model = flags.model || (mode === 'ask' ? 'gpt-5.4-mini' : 'gpt-5.3-codex');
let prompt;
if (mode === 'build') {
  if (!flags.task) { console.error('build needs --task "<what to do>"'); process.exit(2); }
  const area = flags.piece ? ` on the area "${flags.piece}"` : '';
  prompt = `You are a builder in this repository${area}. Read AGENTS.md first, and docs/working.md if it exists; they are the
rules and the owner's decisions, and they win over this task wherever they conflict (say so in your final message when
that happens). Task: ${flags.task}
Stay inside the files the task concerns; make the smallest additive edit to any shared file. Anything you start must
stop within the same command. Run the repository's check command as AGENTS.md gives it and paste its summary line.
Do not commit and do not push: the lead reviews and commits. Your final message: what changed (files, one line each),
the check's summary line, and anything the owner must decide.`;
} else {
  const q = words.join(' ').trim();
  if (!q) { console.error('ask needs a question'); process.exit(2); }
  prompt = `Answer this question about this repository by reading the code (change nothing): ${q}
Cite file paths. Be brief.`;
}

const outDir = path.join(os.tmpdir(), `codex-${path.basename(ROOT)}`);
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${mode}.md`);

const codexArgs = ['exec', '-m', model, '-C', ROOT, '-o', outFile, '--color', 'never'];
if (mode === 'ask') codexArgs.push('-s', 'read-only');
else codexArgs.push('-s', 'workspace-write', '-c', 'sandbox_workspace_write.network_access=true');
codexArgs.push(prompt);

const env = { ...process.env };
const loggedIn = fs.existsSync(path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'auth.json'));
if (!env.OPENAI_API_KEY && !loggedIn) env.OPENAI_API_KEY = 'sk-proxy-injected';

function findCodex() {
  const onPath = spawnSync('codex', ['--version'], { stdio: 'ignore' });
  if (!onPath.error && onPath.status === 0) return 'codex';
  const prefix = spawnSync('npm', ['prefix', '-g'], { encoding: 'utf8' }).stdout?.trim();
  const bin = prefix ? path.join(prefix, 'bin', 'codex') : null;
  if (bin && fs.existsSync(bin)) return bin;
  console.log('[codex] not installed here; installing once with npm i -g @openai/codex');
  const inst = spawnSync('npm', ['i', '-g', '@openai/codex', '--no-audit', '--no-fund'], { stdio: 'inherit' });
  if (inst.status !== 0 || !bin || !fs.existsSync(bin)) { console.error('Codex could not be installed.'); process.exit(1); }
  return bin;
}

if (flags['dry-run']) {
  console.log('codex ' + codexArgs.slice(0, -1).map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ') + ' "<prompt>"');
  console.log('\n' + prompt);
  process.exit(0);
}
const codex = findCodex();
console.log(`[codex] ${mode} on ${model}; last message -> ${outFile}`);
const r = spawnSync(codex, codexArgs, { cwd: ROOT, env, stdio: ['ignore', 'inherit', 'inherit'] });
if (r.error) { console.error(`codex could not be started (${r.error.message})`); process.exit(1); }
process.exit(r.status ?? 1);
