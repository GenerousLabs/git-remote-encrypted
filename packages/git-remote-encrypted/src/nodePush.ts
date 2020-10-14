import execa from 'execa';
import { packageLog } from './log';
import { Push } from './types';

const log = packageLog.extend('nodePush');

export const nodePush: Push = async ({ dir, url, branch }) => {
  log('Running nodePush() #QSGMOe');
  const result = await execa('git', ['push', url, `HEAD:${branch}`], {
    cwd: dir,
  });

  if (result.exitCode !== 0) {
    log('git push failed #F86Gno', JSON.stringify({ url, branch, result }));
    throw new Error('External git failed #zE2RxJ');
  }
};
