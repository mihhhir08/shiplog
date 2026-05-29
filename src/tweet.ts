import type { Commit } from './git';

export interface TweetVars {
  commits: string;
  next: string;
  summary: string;
}

const MAX_CHARS = 280;

export function trimTo280(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  return text.slice(0, MAX_CHARS - 3) + '...';
}

export function renderTemplate(template: string, vars: TweetVars): string {
  return template
    .replace(/{commits}/g, vars.commits)
    .replace(/{next}/g, vars.next)
    .replace(/{summary}/g, vars.summary);
}

export function autoTweet(commits: Commit[], next?: string): string {
  if (commits.length === 0) {
    return 'No commits today, but still building. #buildinpublic';
  }

  const highlights = commits.slice(0, 2).map((c) => c.subject).join(', ');
  const base = `Shipped today: ${highlights}.`;

  if (next) {
    const withNext = `${base} Next up: ${next}. #buildinpublic`;
    if (withNext.length <= MAX_CHARS) return withNext;
  }

  return trimTo280(`${base} #buildinpublic`);
}
