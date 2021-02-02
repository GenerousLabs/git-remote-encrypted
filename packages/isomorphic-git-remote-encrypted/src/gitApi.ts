import { GitApi } from 'git-encrypted';
import git from 'isomorphic-git';
import { packageLog } from './packageLog';

const log = packageLog.extend('gitApi');
const logClone = log.extend('clone');
const logPull = log.extend('pull');
const logPush = log.extend('push');

export const gitApi: GitApi = {
  clone: async params => {
    const {
      fs,
      http,
      corsProxy,
      encryptedDir,
      encryptedRemoteUrl,
      throwOnError = true,
    } = params;
    try {
      logClone(
        'Invoked #v3RyxZ',
        JSON.stringify({
          corsProxy,
          encryptedDir,
          encryptedRemoteUrl,
          throwOnError,
        })
      );
      await git.clone({
        fs,
        http,
        corsProxy,
        dir: encryptedDir,
        url: encryptedRemoteUrl,
      });
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
    }
  },
  pull: async params => {
    const { fs, http, corsProxy, encryptedDir, throwOnError = true } = params;
    try {
      logPull(
        'Invoked #ttv76Y',
        JSON.stringify({ corsProxy, encryptedDir, throwOnError })
      );
      await git.pull({
        fs,
        http,
        corsProxy,
        dir: encryptedDir,
        author: {
          name: 'isomorphic-git-remote-encrypted',
        },
      });
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
    }
  },
  push: async params => {
    const { fs, http, corsProxy, encryptedDir, throwOnError = true } = params;
    try {
      logPush(
        'Invoked #JCwPKA',
        JSON.stringify({ corsProxy, encryptedDir, throwOnError })
      );
      await git.push({
        fs,
        http,
        corsProxy,
        dir: encryptedDir,
      });
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
    }
  },
};
