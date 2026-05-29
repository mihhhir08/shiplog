# shiplog

Turn recent git commits into a clean build-in-public update.

Reads your git history and formats it into a dated Markdown summary with shipped changes, a next goal, and an X/Twitter-ready snippet — all from the command line, zero configuration.

## Installation

### Global install (once published to npm)

```bash
npm install -g shiplog
```

### Run without installing

```bash
npx shiplog
```

### Local development

```bash
git clone <your-fork>
cd shiplog
npm install
npm run build
npm link
shiplog --since "24 hours ago"
```

> **Note:** Publishing to npm is a post-MVP step. Use `npm link` for local development.

## Usage

```
shiplog [options]

Options:
  --since <timeframe>         Time range for commits (default: "24 hours ago")
  --next <goal>               Your next goal (shown in Next up section)
  --output <file>             Write Markdown output to a file
  --tweet-template <tmpl>     Custom tweet template
  -V, --version               Show version number
  -h, --help                  Show help
```

## Examples

**Daily update (last 24 hours):**
```bash
shiplog
```

**Last 3 days:**
```bash
shiplog --since "3 days ago"
```

**With a next goal:**
```bash
shiplog --next "Ship the payment flow"
```

**Write to a file:**
```bash
shiplog --output SHIPLOG.md
```

**Full example:**
```bash
shiplog --since "2 days ago" --next "Add dark mode" --output update.md
```

**Custom tweet template:**
```bash
shiplog --tweet-template "Shipped: {commits}. Next up: {next} #buildinpublic"
```

Supported template placeholders: `{commits}`, `{next}`, `{summary}`

## Example output

```markdown
## Shiplog — May 29, 2026

Worked on auth middleware, dark mode, and 1 other change(s).

### Shipped
- Add dark mode toggle
- Fix login redirect bug
- Refactor auth middleware

### Next up
- [ ] Ship the payment flow

---
### Share on X
Shipped today: Add dark mode toggle, Fix login redirect bug. Next up: Ship the payment flow. #buildinpublic
```

## Development

```bash
npm test          # run Vitest unit tests
npm run build     # compile TypeScript to dist/
npm run dev       # run CLI directly via tsx (no build needed)
```

Tests cover all pure functions (`parseCommits`, `trimTo280`, `renderTemplate`, `autoTweet`, `buildSummary`, `buildMarkdown`) with no subprocess mocking required.

## Roadmap

- `--format json` for machine-readable output
- Persistent next goals via `.shiplog` config or `NEXT.md`
- `--repo <path>` to run against a different repository
- GitHub Actions integration example
- Group commits by conventional commit type (`feat:`, `fix:`, `chore:`)
