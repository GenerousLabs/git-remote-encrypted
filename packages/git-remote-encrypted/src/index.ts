#!/usr/bin/env node

/**
 * DO
 * - [x] Decide how to store refs
 * - [ ] Create a list of only new filenames
 * - [ ] Figure out how to get the upstream encrypted remote
 */

import fs from 'fs';
import {
  DEFAULT_KEYS,
  encryptedPull,
  encryptedPush,
  getRefsGitString,
  nodeGitApi as gitApi,
  EncryptedPushResult,
} from 'git-encrypted';
import GitRemoteHelper from 'git-remote-helper';
import http from 'isomorphic-git/http/node';
import { packageLog } from './log';

globalThis['__DEV__'] = process.env.NODE_ENV !== 'production';

const log = packageLog.extend('cli');
const logList = log.extend('list');
const logPush = log.extend('push');
const logFetch = log.extend('fetch');

const baseGitParams = {
  fs,
  http,
  getKeys: async () => DEFAULT_KEYS,
  gitApi,
};

GitRemoteHelper({
  env: process.env,
  stdin: process.stdin,
  stdout: process.stdout,
  api: {
    list: async ({ gitdir, forPush, refs, remoteUrl }) => {
      logList('Got list command #VJhzH4', gitdir, forPush, refs);

      const refsString = await getRefsGitString({
        ...baseGitParams,
        gitdir,
        remoteUrl,
      });

      // In the event of an empty string, return just one newline
      if (refsString.length === 0) {
        return '\n';
      }

      return `${refsString}\n\n`;
    },
    handleFetch: async ({ gitdir, refs, remoteUrl }) => {
      // TODO Implement the fetch of objects here
      logFetch('handleFetch() invoked #nGa2WK', JSON.stringify({ refs }));

      await encryptedPull({
        ...baseGitParams,
        gitdir,
        remoteUrl,
      });

      // - [ ] Ensure that the `encrypted/` folder exists
      // - [ ] Ensure that it's a git repository
      // - [ ] `git pull` from the remote
      // - [ ] Run our local decryption pull

      // Fetch need only return a single newline after it's completed, then it
      // is assumed to have succeeded.
      // await pull({ fs, dir });
      return '\n';
    },
    handlePush: async ({ refs, gitdir, remoteUrl }) => {
      logPush('handlePush() invoked #Fl6g38');

      const results = await encryptedPush({
        ...baseGitParams,
        gitdir,
        remoteUrl,
        refs,
      });

      const outputString = results
        .map(refResult => {
          const isError = refResult.result === EncryptedPushResult.error;
          const okOrError = isError ? 'error' : 'ok';
          const errorMessagePlusSpace = isError
            ? ' Encrypted push error. Try DEBUG=* fore more info. #qRoqYY'
            : '';

          return `${okOrError} ${refResult.dst}${errorMessagePlusSpace}`;
        })
        .join('\n');

      if (outputString.length === 0) {
        return '\n';
      }

      return outputString + '\n\n';
      // });

      /*
      const encryptedDir = gitDirToEncryptedDir({ dir });

      const existingObjectIds = new Set<string>();

      const objectIds = new Set<string>();
      const filenames = new Set<string>();

      const response = await Bluebird.mapSeries(refs, async ref => {
        try {
          // TODO Get better at skipping history here
          const pushRefResponse = await pushRef({
            fs,
            dir,
            ignoreObjectIds: existingObjectIds,
            pushRef: ref.src,
          });
          pushRefResponse.objectIds.forEach(objectId => {
            objectIds.add(objectId);
          });
          pushRefResponse.filenames.forEach(filename => {
            filenames.add(filename);
          });

          await setRef({
            dir,
            fs,
            oid: pushRefResponse.refCommitId,
            ref: ref.dst,
          });

          return `ok ${ref.dst}`;
        } catch (error) {
          return `error ${ref.dst}`;
        }
      });
      */

      // Now do the encrypted repo push
      // await encryptedRepoAddAndPush({
      //   fs,
      //   encryptedDir,
      //   http,
      //   remoteUrl,
      //   push: encryptedNodePush,
      // });

      // return response.join('\n') + '\n\n';
      return ['a', 'b'].join('\n') + '\n\n';
    },
  },
});
