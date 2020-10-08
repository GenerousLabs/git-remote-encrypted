import Bluebird from 'bluebird';
import git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node';
import path from 'path';

const DEBUG = true;

const params = {
  fs,
  http,
  dir: path.join(__dirname, '../', 'repo'),
};

export const start = async () => {
  if (DEBUG) console.log('dir #AGIM7a', params.dir);

  const commits = new Set<string>();
  const trees = new Set<string>();

  const log = await git.log({ ...params });

  if (DEBUG) console.log('Log #T71dMA', log);

  await Bluebird.each(log, logEntry => {
    commits.add(logEntry.oid);
    trees.add(logEntry.commit.tree);
  });

  if (DEBUG)
    console.log(
      'Commits',
      commits.entries(),
      'Trees',
      trees.entries(),
      '#Nzk9nr'
    );

  await Bluebird.each(commits, async oid => {
    const object = await git.readObject({ ...params, oid, format: 'wrapped' });
    console.log('Found object #7bAlBa', object);
  });
};

start();

export const sum = (a: number, b: number) => {
  if ('development' === process.env.NODE_ENV) {
    console.log('boop');
  }
  return a + b;
};
