import execa from 'execa';
import { packageLog } from '../log';
import { EncryptedPushPull } from '../types';

const log = packageLog.extend('node');
const logClone = log.extend('clone');
const logPush = log.extend('push');
const logPull = log.extend('pull');

export const clone: EncryptedPushPull = async ({
  encryptedDir,
  encryptedRemoteUrl: url,
  throwOnError = true,
}) => {
  logClone('Running node gitApi.clone() #50DK7v');
  const result = await execa(
    'git',
    ['clone', '--single-branch', '--no-tags', url, '.'],
    {
      reject: false,
      cwd: encryptedDir,
    }
  );

  if (result.exitCode !== 0) {
    logClone('git clone failed #8X8sv5', JSON.stringify({ url, result }));
    if (throwOnError) {
      throw new Error('External git clone failed #MoPixQ');
    }
  }
};

export const push: EncryptedPushPull = async ({
  encryptedDir,
  encryptedRemoteUrl: url,
  throwOnError = true,
}) => {
  logPush('Running node gitApi.push() #QSGMOe');
  const result = await execa('git', ['push'], {
    reject: false,
    cwd: encryptedDir,
  });

  if (result.exitCode !== 0) {
    logPush('git push failed #F86Gno', JSON.stringify({ url, result }));
    if (throwOnError) {
      throw new Error('External git push failed #zE2RxJ');
    }
  }
};

export const pull: EncryptedPushPull = async ({
  encryptedDir,
  encryptedRemoteUrl: url,
  throwOnError = true,
}) => {
  logPull('Running node gitApi.pull() #xSQvYe');
  const result = await execa('git', ['pull'], {
    reject: false,
    cwd: encryptedDir,
  });

  if (result.exitCode !== 0) {
    logPull('git pull failed #nP2w0L', JSON.stringify({ url, result }));
    if (throwOnError) {
      throw new Error('External git pull failed #O2TOzC');
    }
  }
};
