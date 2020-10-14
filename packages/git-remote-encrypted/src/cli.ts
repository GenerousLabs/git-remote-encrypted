#!/usr/bin/env node

/**
 * DO
 * - [x] Decide how to store refs
 * - [ ] Create a list of only new filenames
 * - [ ] Figure out how to get the upstream encrypted remote
 */

import Bluebird from 'bluebird';
import fs from 'fs';
import GitRemoteHelper, { PushRef } from 'git-remote-helper';
import { encryptedRepoAddAndPush, pull, pushRef } from './encrypted';
import { packageLog } from './log';
import { getRefs, refsToString, setRef } from './refs';

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

      const existingRefs = await getRefs({ fs, dir });
      const refsString = refsToString({ refs: existingRefs });

      // In the event of an empty string, return just one newline
      if (refsString.length === 0) {
        return '\n';
      }

      return `${refsString}\n\n`;
    },
    handleFetch: async ({ refs, dir }) => {
      // TODO Implement the fetch of objects here
      logFetch('handleFetch() invoked #nGa2WK', JSON.stringify({ refs }));
      // Fetch need only return a single newline after it's completed, then it
      // is assumed to have succeeded.
      await pull({ fs, dir });
      return '\n';
    },
    handlePush: async ({ refs, dir }: { dir: string; refs: PushRef[] }) => {
      logPush('handlePush() invoked #Fl6g38');

      const existingObjectIds = new Set<string>();

      const objectIds = new Set<string>();
      const filenames = new Set<string>();

      const response = await Bluebird.mapSeries(refs, async ref => {
        try {
          const pushRefResponse = await pushRef({
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

      // Now do the encrypted repo push
      await encryptedRepoAddAndPush({ filenames });

      return response.join('\n') + '\n\n';
    },
  },
});
