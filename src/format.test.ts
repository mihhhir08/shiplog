import { describe, it, expect } from 'vitest';
import { buildSummary, buildMarkdown } from './format';
import type { Commit } from './git';

function makeCommit(subject: string): Commit {
  return { hash: 'abc123', subject, author: 'Alice', date: '2026-05-29' };
}

const tweetLine = 'Shipped today: dark mode. #buildinpublic';

describe('buildSummary', () => {
  it('returns empty string for no commits', () => {
    expect(buildSummary([])).toBe('');
  });

  it('handles one commit', () => {
    expect(buildSummary([makeCommit('Add dark mode')])).toBe(
      'Worked on Add dark mode.'
    );
  });

  it('handles two commits', () => {
    const result = buildSummary([
      makeCommit('Add dark mode'),
      makeCommit('Fix login'),
    ]);
    expect(result).toBe('Worked on Add dark mode and Fix login.');
  });

  it('handles three or more commits with remaining count', () => {
    const commits = [makeCommit('Alpha'), makeCommit('Beta'), makeCommit('Gamma')];
    expect(buildSummary(commits)).toBe(
      'Worked on Alpha, Beta, and 1 other change(s).'
    );
  });

  it('handles five commits with correct remaining count', () => {
    const commits = [
      makeCommit('Alpha'),
      makeCommit('Beta'),
      makeCommit('Gamma'),
      makeCommit('Delta'),
      makeCommit('Epsilon'),
    ];
    expect(buildSummary(commits)).toBe(
      'Worked on Alpha, Beta, and 3 other change(s).'
    );
  });
});

describe('buildMarkdown', () => {
  it('renders friendly empty state when no commits', () => {
    const md = buildMarkdown([], { since: '24 hours ago', tweetLine });
    expect(md).toContain('No commits found since 24 hours ago.');
    expect(md).toContain('- [ ] Add your next goal here');
    expect(md).toContain('### Share on X');
    expect(md).toContain(tweetLine);
  });

  it('includes ## Shiplog heading with date', () => {
    const md = buildMarkdown([makeCommit('Add dark mode')], {
      since: '24 hours ago',
      tweetLine,
    });
    expect(md).toMatch(/^## Shiplog — /m);
  });

  it('renders a bullet for each commit in Shipped section', () => {
    const commits = [makeCommit('Add dark mode'), makeCommit('Fix login')];
    const md = buildMarkdown(commits, { since: '24 hours ago', tweetLine });
    expect(md).toContain('### Shipped');
    expect(md).toContain('- Add dark mode');
    expect(md).toContain('- Fix login');
  });

  it('uses --next value in Next up section when provided', () => {
    const commits = [makeCommit('Add dark mode')];
    const md = buildMarkdown(commits, {
      since: '24 hours ago',
      next: 'Ship payments',
      tweetLine,
    });
    expect(md).toContain('- [ ] Ship payments');
    expect(md).not.toContain('- [ ] Add your next goal here');
  });

  it('shows placeholder when --next is not provided', () => {
    const commits = [makeCommit('Add dark mode')];
    const md = buildMarkdown(commits, { since: '24 hours ago', tweetLine });
    expect(md).toContain('- [ ] Add your next goal here');
  });

  it('includes Share on X section with tweet line', () => {
    const commits = [makeCommit('Add dark mode')];
    const md = buildMarkdown(commits, { since: '24 hours ago', tweetLine });
    expect(md).toContain('### Share on X');
    expect(md).toContain(tweetLine);
  });

  it('empty state also includes Share on X with tweet line', () => {
    const md = buildMarkdown([], { since: '24 hours ago', tweetLine });
    expect(md).toContain('### Share on X');
    expect(md).toContain(tweetLine);
  });
});
