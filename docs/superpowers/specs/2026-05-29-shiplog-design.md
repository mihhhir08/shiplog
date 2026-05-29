# shiplog — Design Spec

**Date:** 2026-05-29  
**Status:** Approved

## Overview

`shiplog` is an open-source Node.js CLI that reads recent git commits and formats them into a clean build-in-public update. It produces a dated Markdown document with a summary, bullet list of shipped changes, a "next up" goal, and an X/Twitter-friendly snippet.

---

## Goals

- Turn `git log` output into a polished daily shipping update with zero configuration
- Support flexible time ranges via `--since`
- Allow users to capture their next goal via `--next`
- Produce an X/Twitter-ready snippet (auto-generated or user-templated) under 280 characters
- Write output to stdout or a Markdown file via `--output`
- Be beginner-friendly: small focused modules, no magic, no external API calls

---

## Non-Goals (MVP)

- No AI-generated summaries
- No persistent config files (`.shiplog`, `NEXT.md`)
- No GitHub/GitLab API integration (local git only)
- No interactive prompts

---

## CLI Contract

**Command:** `shiplog`

**Flags:**

| Flag | Type | Default | Description |
|---|---|---|---|
| `--since` | string | `"24 hours ago"` | Passed directly to `git log --since` |
| `--next` | string | `undefined` | Next goal text inserted into "Next up" section |
| `--output` | string | `undefined` | Write Markdown output to this file path |
| `--tweet-template` | string | `undefined` | Custom template; supports `{commits}`, `{next}`, `{summary}` placeholders |

No positional arguments.

**Examples:**
```bash
shiplog
shiplog --since "3 days ago"
shiplog --next "Ship the payment flow"
shiplog --output SHIPLOG.md
shiplog --since "2 days ago" --next "Add dark mode" --output update.md
shiplog --tweet-template "Shipped: {commits}. Next up: {next} #buildinpublic"
```

---

## Architecture

Four focused modules in a linear pipeline:

```
cli.ts → git.ts → format.ts → tweet.ts → stdout / file
```

### `src/git.ts`

Reads commits from the local git repository using `child_process.execSync`. Uses ASCII control characters as delimiters to safely handle commit subjects that may contain arbitrary characters.

**git log format:**
```
git log --since="24 hours ago" --pretty=format:"%H%x1f%s%x1f%an%x1f%ai%x1e"
```

- Field separator: `%x1f` (ASCII Unit Separator, )
- Record separator: `%x1e` (ASCII Record Separator, )

**Exported types:**
```ts
interface Commit {
  hash: string;     // full SHA
  subject: string;  // commit message subject line
  author: string;   // author name
  date: string;     // ISO 8601 date string
}
```

**Exported functions:**
- `getCommits(since: string): Commit[]` — runs git log, parses output, returns commits newest-first
- `parseCommits(raw: string): Commit[]` — pure parse function (used by tests)

If `git log` fails (not a git repo, git not installed), throws a descriptive error caught by `cli.ts`.

### `src/format.ts`

Pure functions that build the Markdown output from commits and flags. No side effects.

**Exported functions:**
- `buildSummary(commits: Commit[], since: string): string` — one-sentence summary:
  - 1 commit: `"Worked on {subject}."`
  - 2 commits: `"Worked on {subject1} and {subject2}."`
  - 3+ commits: `"Worked on {subject1}, {subject2}, and {N} other change(s)."`
- `buildMarkdown(commits: Commit[], opts: FormatOptions): string` — assembles the full Markdown document

**`FormatOptions`:**
```ts
interface FormatOptions {
  since: string;
  next?: string;
  tweetLine: string;  // pre-rendered tweet string passed in from tweet.ts
}
```

**No-commits case:** When `commits` is empty, `buildMarkdown` renders the friendly empty-state output (see Output Format section). `autoTweet` with an empty commits array returns the fixed string `"No commits today, but still building. #buildinpublic"`.

### `src/tweet.ts`

Generates the X/Twitter-friendly line. Pure functions, no side effects.

**Exported functions:**
- `autoTweet(commits: Commit[], next?: string): string` — auto-generates tweet from top 1-2 commit subjects; includes next goal if it fits within 280 chars
- `renderTemplate(template: string, vars: TweetVars): string` — replaces `{commits}`, `{next}`, `{summary}` placeholders
- `trimTo280(text: string): string` — trims to 280 chars, appending `...` within the limit if truncation was needed

**`TweetVars`:**
```ts
interface TweetVars {
  commits: string;   // top commit subjects, comma-separated
  next: string;      // next goal or empty string
  summary: string;   // short summary sentence
}
```

**Template rendering priority:**
1. If `--tweet-template` is provided: render template → trim to 280
2. Otherwise: auto-generate → trim to 280

### `src/cli.ts`

Commander setup and orchestration. Imports all other modules, wires flags to pipeline, handles errors, writes to stdout or file.

**Responsibilities:**
- Define commander program with all flags and help text
- Call `getCommits(since)`
- Build tweet string via `tweet.ts`
- Build Markdown via `format.ts`
- Write to stdout or file path from `--output`
- Catch errors (not a git repo, no git binary) and print a human-friendly message to stderr, exit code 1

---

## Output Format

### With commits:

```markdown
## Shiplog — May 29, 2026

Worked on auth middleware, dark mode, and login fixes.

### Shipped
- Add dark mode toggle
- Fix login redirect bug
- Refactor auth middleware

### Next up
- [ ] Ship the payment flow

---
### Share on X
Shipped today: dark mode toggle, login fix. Next up: Ship the payment flow. #buildinpublic
```

### No commits (empty state):

```markdown
## Shiplog — May 29, 2026

No commits found since 24 hours ago.

### Next up
- [ ] Add your next goal here

---
### Share on X
No commits today, but still building. #buildinpublic
```

---

## Tweet Generation

### Auto-generation (no `--tweet-template`):

- Opens with `"Shipped today:"`
- Lists top 1–2 commit subjects (trimmed to ~60 chars each if long)
- Appends next goal (`"Next up: {next}."`) only if the result stays under 280 chars
- Appends `#buildinpublic`
- Hard cap: 280 characters via `trimTo280`

### Template rendering (`--tweet-template`):

Supported placeholders:
- `{commits}` — top commit subjects, comma-separated
- `{next}` — next goal text, or empty string if `--next` not provided
- `{summary}` — short generated summary sentence

Rendering replaces all placeholders, then passes through `trimTo280`.

### `trimTo280` behavior:

If `text.length <= 280`, returns as-is. If over 280, truncates to 277 chars and appends `...`.

---

## Project Structure

```
shiplog/
├── src/
│   ├── cli.ts
│   ├── git.ts
│   ├── format.ts
│   └── tweet.ts
├── src/
│   ├── git.test.ts
│   ├── format.test.ts
│   └── tweet.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

*(Tests live alongside source files as `*.test.ts`)*

---

## Testing

Three test files covering the three pure modules:

**`git.test.ts`** — tests `parseCommits(raw)`:
- Parses single commit correctly
- Parses multiple commits
- Returns empty array for empty string
- Handles subjects containing `|`, `"`, and other special characters

**`format.test.ts`** — tests `buildSummary` and `buildMarkdown`:
- Summary with 1 commit
- Summary with 3+ commits
- Markdown with commits and `--next`
- Markdown with commits, no `--next` (shows placeholder)
- Empty-state Markdown (no commits)

**`tweet.test.ts`** — tests `autoTweet`, `renderTemplate`, `trimTo280`:
- Auto-tweet with 1 commit
- Auto-tweet with 3 commits (only top 2 shown)
- Auto-tweet with `--next` that fits within 280
- Auto-tweet where `--next` pushes over 280 (omitted gracefully)
- Template rendering with all three placeholders
- Template rendering with `{next}` = empty string
- `trimTo280` on string exactly 280 chars (no truncation)
- `trimTo280` on string 281 chars (truncated with `...`)

---

## Package Setup

**`package.json` bin entry:**
```json
{
  "name": "shiplog",
  "bin": {
    "shiplog": "./dist/cli.js"
  }
}
```

Works as both:
- `npm install -g shiplog` → `shiplog`
- `npx shiplog`

**npm scripts:**
```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "dev": "ts-node src/cli.ts"
  }
}
```

**Local dev workflow:**
```bash
npm install
npm run build
npm link
shiplog --since "24 hours ago"
```

---

## README Sections

1. What is shiplog
2. Installation (global npm + npx + local dev/npm link)
3. Usage & flags table
4. Examples (basic, with `--since`, with `--next`, with `--output`, with `--tweet-template`)
5. Output example (rendered Markdown block)
6. Roadmap

---

## Roadmap (post-MVP)

- `--format json` for machine-readable output
- Persistent next goals via `.shiplog` config or `NEXT.md`
- `--repo <path>` to run against a different repository
- GitHub Actions integration example
- Grouping commits by conventional commit type (`feat:`, `fix:`, `chore:`)
