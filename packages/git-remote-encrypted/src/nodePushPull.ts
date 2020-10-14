import execa from 'execa';
import { packageLog } from './log';
import { PushPull } from './types';

const log = packageLog.extend('node');
const logPush = log.extend('push');
const logPull = log.extend('pull');

export const nodePush: PushPull = async ({ dir, url, branch }) => {
  logPush('Running nodePush() #QSGMOe');
  const result = await execa('git', ['push', url, `${branch}:${branch}`], {
    cwd: dir,
  });

  if (result.exitCode !== 0) {
    logPush('git push failed #F86Gno', JSON.stringify({ url, branch, result }));
    throw new Error('External git failed #zE2RxJ');
  }
};

export const nodePull: PushPull = async ({ dir, url, branch }) => {
  logPull('Running nodePull() #xSQvYe');
  const result = await execa('git', ['pull', url, `${branch}:${branch}`], {
    cwd: dir,
  });

  if (result.exitCode !== 0) {
    logPull('git push failed #nP2w0L', JSON.stringify({ url, branch, result }));
    throw new Error('External git pull failed #O2TOzC');
  }
};
