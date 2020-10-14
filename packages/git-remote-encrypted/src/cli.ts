#!/usr/bin/env node

import debug from 'debug';
import GitRemoteHelper, { PushRef } from 'git-remote-helper';

const log = debug('cli');

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
      log('Got list command #VJhzH4', dir, forPush, refs);
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
      // Do the actual magic here
      return refs.map(ref => `ok ${ref.dst}`).join('\n') + '\n\n';
    },
  },
});
