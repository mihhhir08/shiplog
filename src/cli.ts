#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { getCommits } from './git';
import { buildSummary, buildMarkdown, FormatOptions } from './format';
import { autoTweet, renderTemplate, trimTo280, TweetVars } from './tweet';

const program = new Command();

program
  .name('shiplog')
  .description('Turn recent git commits into a clean build-in-public update')
  .version('0.1.0')
  .option('--since <timeframe>', 'time range for commits', '24 hours ago')
  .option('--next <goal>', 'your next goal')
  .option('--output <file>', 'write Markdown output to a file')
  .option(
    '--tweet-template <template>',
    'custom tweet template — supports {commits}, {next}, {summary}'
  )
  .action((options) => {
    try {
      const commits = getCommits(options.since);

      const tweetVars: TweetVars = {
        commits: commits.slice(0, 2).map((c) => c.subject).join(', '),
        next: options.next ?? '',
        summary: buildSummary(commits),
      };

      const tweetLine = options.tweetTemplate
        ? trimTo280(renderTemplate(options.tweetTemplate, tweetVars))
        : autoTweet(commits, options.next);

      const formatOpts: FormatOptions = {
        since: options.since,
        next: options.next,
        tweetLine,
      };

      const markdown = buildMarkdown(commits, formatOpts);

      if (options.output) {
        writeFileSync(options.output, markdown, 'utf8');
        console.log(`Written to ${options.output}`);
      } else {
        console.log(markdown);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error: ${message}\n`);
      process.exit(1);
    }
  });

program.parse();
