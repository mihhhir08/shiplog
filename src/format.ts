import type { Commit } from './git';

export interface FormatOptions {
  since: string;
  next?: string;
  tweetLine: string;
}

export function buildSummary(commits: Commit[]): string {
  if (commits.length === 0) return '';
  if (commits.length === 1) return `Worked on ${commits[0].subject}.`;
  if (commits.length === 2) {
    return `Worked on ${commits[0].subject} and ${commits[1].subject}.`;
  }
  return `Worked on ${commits[0].subject}, ${commits[1].subject}, and ${commits.length - 2} other change(s).`;
}

export function buildMarkdown(commits: Commit[], opts: FormatOptions): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const nextSection = opts.next
    ? `### Next up\n- [ ] ${opts.next}`
    : `### Next up\n- [ ] Add your next goal here`;

  if (commits.length === 0) {
    return [
      `## Shiplog — ${date}`,
      '',
      `No commits found since ${opts.since}.`,
      '',
      nextSection,
      '',
      '---',
      '### Share on X',
      opts.tweetLine,
    ].join('\n');
  }

  const summary = buildSummary(commits);
  const bullets = commits.map((c) => `- ${c.subject}`).join('\n');

  return [
    `## Shiplog — ${date}`,
    '',
    summary,
    '',
    '### Shipped',
    bullets,
    '',
    nextSection,
    '',
    '---',
    '### Share on X',
    opts.tweetLine,
  ].join('\n');
}
