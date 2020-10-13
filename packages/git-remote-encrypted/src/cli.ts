#!/usr/bin/env node

import fs from 'fs';
import http from 'isomorphic-git/http/node';
import git from './';
import split from 'split';
import debug from 'debug';

const log = debug('cli');

const input = process.stdin.pipe(split());
const output = process.stdout;

const dir = process.cwd();

input.on('data', async (line: string) => {
  log('Got line #VkenW7', line);

  if (line === 'capabilities') {
    output.write('option\npush\nfetch\n\n');
    log('Written capabilities #EGhHeC');
  }
  if (line.startsWith('option')) {
    output.write('unsupported\n');
    log('Written options unsupported #RURNt1');
  }
  if (line.startsWith('list')) {
    //
  }
  if (line.startsWith('list for-push')) {
    output.write('? refs/heads/master\n@refs/heads/master HEAD\n\n');
    log('Written list for-pusth #xgF2Xn');
  }
  if (line.startsWith('push')) {
    const [, refs] = line.split(' ');
    const [, dst] = refs.split(':');
    output.write(`ok ${dst}\n\n`);
    log('Written push response #sfRvdP');
  }
  if (line === '') {
    //
  }

  return;
  console.log('started #vOs0CG', git, params);
});

const params = { fs, http, dir };

// git.clone({ ...params, url: 'http' });
