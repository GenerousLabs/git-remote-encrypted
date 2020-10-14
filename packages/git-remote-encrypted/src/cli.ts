#!/usr/bin/env node

/**
 * - [ ] Decide how to store refs
 * - [ ] Create a list of only new filenames
 * - [ ] Figure out how to get the upstream encrypted remote
 */

import Bluebird from 'bluebird';
import GitRemoteHelper, { PushRef } from 'git-remote-helper';
import { encryptedRepoAddAndPush, pushRef } from './encrypted';
import { packageLog } from './log';

globalThis['__DEV__'] = process.env.NODE_ENV !== 'production';

const log = packageLog.extend('cli');
const logList = log.extend('list');
const logPush = log.extend('push');
const logFetch = log.extend('fetch');

GitRemoteHelper({
  env: process.env,
  stdin: process.stdin,
  stdout: process.stdout,
  api: {
    list: async ({
      dir,
      forPush,
      refs,
    }: {
      refs: string[];
      dir: string;
      forPush: boolean;
    }) => {
      logList('Got list command #VJhzH4', dir, forPush, refs);
      // TODO Get the real refs here
      if (forPush) {
        // return '6461a36f29705b8f3d141ef877715b61c38c7158 refs/heads/master\n@refs/heads/master HEAD\n\n';
        // return '91172de05a7e6e19f91ef97daf157a9de0b9da1a refs/heads/master\n@refs/heads/master HEAD\n\n';
        return '? refs/heads/master\n@refs/heads/master HEAD\n\n';
      } else {
        // return '6461a36f29705b8f3d141ef877715b61c38c7158 refs/heads/master\n@refs/heads/master HEAD\n\n';
        // return '91172de05a7e6e19f91ef97daf157a9de0b9da1a refs/heads/master\n@refs/heads/master HEAD\n\n';
        return '? refs/heads/master\n@refs/heads/master HEAD\n\n';
        // return '350130914f6b01295339259ad1bb179773fecb1c refs/heads/master\n@refs/heads/master HEAD\n\n';
      }
    },
    handleFetch: async ({ refs }) => {
      // TODO Implement the fetch of objects here
      logFetch('handleFetch() invoked #nGa2WK', JSON.stringify({ refs }));
      // Fetch need only return a single newline after it's completed, then it
      // is assumed to have succeeded.
      throw new Error('Not yet implemented #PK4otg');
      return '\n';
    },
    handlePush: async ({ refs }: { dir: string; refs: PushRef[] }) => {
      logPush('handlePush() invoked #Fl6g38');

      const existingObjectIds = new Set<string>();

      const objectIds = new Set<string>();
      const filenames = new Set<string>();

      const response = await Bluebird.mapSeries(refs, async ref => {
        try {
          const response = await pushRef({
            ignoreObjectIds: existingObjectIds,
            pushRef: ref.src,
          });
          response.objectIds.forEach(objectId => {
            objectIds.add(objectId);
          });
          response.filenames.forEach(filename => {
            filenames.add(filename);
          });

          return `ok ${ref.dst}`;
        } catch (error) {
          return `error ${ref.dst}`;
        }
      });

      // Now do the encrypted repo push
      await encryptedRepoAddAndPush({ filenames });

      return response.join('\n') + '\n\n';
    },
  },
});
