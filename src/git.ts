import { execSync } from 'child_process';

export interface Commit {
  hash: string;
  subject: string;
  author: string;
  date: string;
}

const FIELD_SEP = '\x1f';
const RECORD_SEP = '\x1e';

export function parseCommits(raw: string): Commit[] {
  if (!raw.trim()) return [];

  return raw
    .split(RECORD_SEP)
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const [hash, subject, author, date] = record.split(FIELD_SEP);
      return { hash, subject, author, date };
    });
}

export function getCommits(since: string): Commit[] {
  const format = `%H%x1f%s%x1f%an%x1f%ai%x1e`;
  const raw = execSync(
    `git log --since="${since}" --pretty=format:"${format}"`,
    { encoding: 'utf8' }
  );
  return parseCommits(raw);
}
