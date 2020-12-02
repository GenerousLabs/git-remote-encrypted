import git from 'isomorphic-git';
import { GitApi } from 'git-encrypted';
import debug from 'debug';

const log = debug('isomorphic-git-remote-encrypted');
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
      encryptedRemoteHeaders,
      throwOnError = true,
    } = params;
    try {
      logClone('Invoked #v3RyxZ', JSON.stringify({ params }));
      await git.clone({
        fs,
        http,
        headers: encryptedRemoteHeaders,
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
    const {
      fs,
      http,
      corsProxy,
      encryptedDir,
      encryptedRemoteHeaders,
      throwOnError = true,
    } = params;
    try {
      logPull('Invoked #ttv76Y', JSON.stringify({ params }));
      await git.pull({
        fs,
        http,
        headers: encryptedRemoteHeaders,
        corsProxy,
        dir: encryptedDir,
      });
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
    }
  },
  push: async params => {
    const {
      fs,
      http,
      corsProxy,
      encryptedDir,
      encryptedRemoteHeaders,
      throwOnError = true,
    } = params;
    try {
      logPush('Invoked #JCwPKA', JSON.stringify({ params }));
      await git.push({
        fs,
        http,
        headers: encryptedRemoteHeaders,
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