import Bluebird from 'bluebird';
import fs from 'fs';
import git, { TREE } from 'isomorphic-git';
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

  const objectIds = new Set<string>();
  const trees = new Set<string>();

  const log = await git.log({ ...params });

  if (DEBUG) console.log('Log #T71dMA', log);

  await Bluebird.each(log, logEntry => {
    objectIds.add(logEntry.oid);
    trees.add(logEntry.commit.tree);
  });

  const walkerTrees = await Bluebird.map(trees, treeObjectId =>
    TREE({ ref: treeObjectId })
  );

  await git.walk({
    ...params,
    trees: walkerTrees,
    map: async (filename, entries) => {
      if (entries === null) {
        return filename;
      }

      await Bluebird.each(entries, async entry => {
        objectIds.add(await entry.oid());
      });

      return filename;
    },
  });

  if (DEBUG)
    console.log(
      'Objects',
      objectIds.entries(),
      'Trees',
      trees.entries(),
      '#Nzk9nr'
    );

  // await Bluebird.each(objectIds, async oid => {
  //   const object = await git.readObject({ ...params, oid, format: 'wrapped' });
  // });
};

start();

export const sum = (a: number, b: number) => {
  if ('development' === process.env.NODE_ENV) {
    console.log('boop');
  }
  return a + b;
};
