import { describe, it, expect } from 'vitest';
import { trimTo280, renderTemplate, autoTweet } from './tweet';
import type { Commit } from './git';

function makeCommit(subject: string): Commit {
  return { hash: 'abc123', subject, author: 'Alice', date: '2026-05-29' };
}

describe('trimTo280', () => {
  it('returns string unchanged when under 280 chars', () => {
    const text = 'Hello world';
    expect(trimTo280(text)).toBe(text);
  });

  it('returns string unchanged when exactly 280 chars', () => {
    const text = 'a'.repeat(280);
    expect(trimTo280(text)).toBe(text);
  });

  it('truncates to 280 chars with ellipsis when over 280', () => {
    const text = 'a'.repeat(281);
    const result = trimTo280(text);
    expect(result).toHaveLength(280);
    expect(result.endsWith('...')).toBe(true);
  });

  it('truncates correctly: 277 kept chars + "..."', () => {
    const text = 'b'.repeat(277) + 'XXXX';
    const result = trimTo280(text);
    expect(result).toBe('b'.repeat(277) + '...');
  });
});

describe('renderTemplate', () => {
  it('replaces all three placeholders', () => {
    const result = renderTemplate(
      'Shipped: {commits}. Next: {next}. Summary: {summary}',
      { commits: 'dark mode', next: 'payments', summary: 'Worked on dark mode.' }
    );
    expect(result).toBe(
      'Shipped: dark mode. Next: payments. Summary: Worked on dark mode.'
    );
  });

  it('replaces {next} with empty string when next is empty', () => {
    const result = renderTemplate('Shipped: {commits}. Next: {next}.', {
      commits: 'dark mode',
      next: '',
      summary: '',
    });
    expect(result).toBe('Shipped: dark mode. Next: .');
  });

  it('replaces multiple occurrences of the same placeholder', () => {
    const result = renderTemplate('{commits} and also {commits}', {
      commits: 'dark mode',
      next: '',
      summary: '',
    });
    expect(result).toBe('dark mode and also dark mode');
  });
});

describe('autoTweet', () => {
  it('returns empty-state tweet when commits array is empty', () => {
    expect(autoTweet([])).toBe(
      'No commits today, but still building. #buildinpublic'
    );
  });

  it('generates tweet with "Shipped today:" prefix from single commit', () => {
    const result = autoTweet([makeCommit('Add dark mode')]);
    expect(result).toContain('Shipped today:');
    expect(result).toContain('Add dark mode');
    expect(result).toContain('#buildinpublic');
  });

  it('uses only the first two commits when more are present', () => {
    const commits = [
      makeCommit('First'),
      makeCommit('Second'),
      makeCommit('Third'),
    ];
    const result = autoTweet(commits);
    expect(result).toContain('First');
    expect(result).toContain('Second');
    expect(result).not.toContain('Third');
  });

  it('includes next goal when it fits within 280 chars', () => {
    const result = autoTweet([makeCommit('Add dark mode')], 'Ship payments');
    expect(result).toContain('Ship payments');
    expect(result.length).toBeLessThanOrEqual(280);
  });

  it('omits next goal when adding it would exceed 280 chars', () => {
    const longSubject = 'a'.repeat(200);
    const longNext = 'b'.repeat(100);
    const result = autoTweet([makeCommit(longSubject)], longNext);
    expect(result).not.toContain(longNext);
    expect(result.length).toBeLessThanOrEqual(280);
  });

  it('result is always 280 chars or fewer', () => {
    const commits = [makeCommit('a'.repeat(300)), makeCommit('b'.repeat(300))];
    expect(autoTweet(commits).length).toBeLessThanOrEqual(280);
  });
});
