import { describe, it, expect } from 'vitest';
import { parseCommits } from './git';

describe('parseCommits', () => {
  it('returns empty array for empty string', () => {
    expect(parseCommits('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseCommits('   \n  ')).toEqual([]);
  });

  it('parses a single commit', () => {
    const raw = 'abc123\x1fAdd dark mode\x1fAlice\x1f2026-05-29T10:00:00+00:00\x1e';
    expect(parseCommits(raw)).toEqual([
      {
        hash: 'abc123',
        subject: 'Add dark mode',
        author: 'Alice',
        date: '2026-05-29T10:00:00+00:00',
      },
    ]);
  });

  it('parses multiple commits in order', () => {
    const raw =
      'abc123\x1fAdd dark mode\x1fAlice\x1f2026-05-29T10:00:00+00:00\x1e' +
      'def456\x1fFix login bug\x1fBob\x1f2026-05-29T09:00:00+00:00\x1e';
    const result = parseCommits(raw);
    expect(result).toHaveLength(2);
    expect(result[0].hash).toBe('abc123');
    expect(result[1].hash).toBe('def456');
  });

  it('handles subjects containing pipe characters', () => {
    const raw = 'abc123\x1fFix | edge | case\x1fAlice\x1f2026-05-29T10:00:00+00:00\x1e';
    expect(parseCommits(raw)[0].subject).toBe('Fix | edge | case');
  });

  it('handles subjects containing double quotes', () => {
    const raw = 'abc123\x1fFix "the" bug\x1fAlice\x1f2026-05-29T10:00:00+00:00\x1e';
    expect(parseCommits(raw)[0].subject).toBe('Fix "the" bug');
  });
});
