import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const sections = [
  {
    title: 'Discord integration',
    items: [
      'Discord bot status is Connected or Ready in the UI.',
      '/serverstatus returns a response in Discord.',
      '!listplayers returns command output in the configured admin channel.',
      'A real game global chat message appears in the configured Discord public channel.',
      'A Discord public-channel message appears in game global chat.',
      'A non-allow-listed Discord command is rejected.',
      'A dangerous command such as !shutdown is rejected.',
    ],
  },
  {
    title: 'GeoIP access control',
    items: [
      'Allowed-decision logging is temporarily enabled.',
      'A real player login creates a recent allowed decision.',
      'Adding the tester IP/CIDR to the block-list blocks login.',
      'The blocked player sees the configured kick message.',
      'Removing the block-list entry and clearing cache allows login again.',
      'Unknown-country policy was tested with a controlled provider failure.',
    ],
  },
  {
    title: 'Event automation',
    items: [
      'A low-risk success rule creates a successful RunLog.',
      'A controlled failure rule creates a failed RunLog.',
      'RunStats reflect the success and failure counts.',
      'Failure navigation opens the matching run history/detail.',
      'Cooldown prevents repeated chat/reward/announcement spam.',
      'firstJoinOnly runs once for a controlled test player.',
      'High-risk actions write audit entries for both allow and reject paths.',
    ],
  },
];

const rl = createInterface({ input, output });
const results = [];

try {
  console.log('Live acceptance checklist');
  console.log('Answer y/n/skip for each item. This script records confirmations only; it does not perform game or Discord actions.');
  console.log('');

  for (const section of sections) {
    console.log(`## ${section.title}`);
    for (const item of section.items) {
      const answer = (await rl.question(`${item} [y/n/skip]: `)).trim().toLowerCase();
      results.push({
        section: section.title,
        item,
        status: answer === 'y' ? 'passed' : answer === 'n' ? 'failed' : 'skipped',
      });
    }
    console.log('');
  }
}
finally {
  rl.close();
}

const passed = results.filter(item => item.status === 'passed').length;
const failed = results.filter(item => item.status === 'failed').length;
const skipped = results.filter(item => item.status === 'skipped').length;

console.log('Summary');
console.log(`passed=${passed}, failed=${failed}, skipped=${skipped}`);

for (const result of results) {
  console.log(`${result.status.toUpperCase().padEnd(7)} ${result.section} - ${result.item}`);
}

if (failed > 0) {
  process.exitCode = 1;
}
