#!/usr/bin/env node

import Bluebird from 'bluebird';
import debug from 'debug';
import GitRemoteHelper, { PushRef } from 'git-remote-helper';
import { pushRef } from './encrypted';

globalThis['__DEV__'] = process.env.NODE_ENV !== 'production';

const log = debug('cli');
const logList = log.extend('list');
const logPush = log.extend('push');

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
      if (forPush) {
        return '? refs/heads/master\n@refs/heads/master HEAD\n\n';
      } else {
        return '91172de05a7e6e19f91ef97daf157a9de0b9da1a refs/heads/master\n@refs/heads/master HEAD\n\n';
      }
    },
    handleFetch: async () => {
      return '';
    },
    handlePush: async ({ refs }: { dir: string; refs: PushRef[] }) => {
      logPush('handlePush() invoked #Fl6g38');

      const existingObjectIds = new Set<string>();

      const response = await Bluebird.mapSeries(refs, async ref => {
        try {
          await pushRef({
            ignoreObjectIds: existingObjectIds,
            pushRef: ref.src,
          });
          return `ok ${ref.dst}`;
        } catch (error) {
          return `error ${ref.dst}`;
        }
      });

      return response.join('\n') + '\n\n';
    },
  },
});
