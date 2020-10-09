import Bluebird from 'bluebird';
import fs from 'fs';
import git, { TREE } from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import path from 'path';
import { encrypt } from './crypto';
import { program } from 'commander';

const DEBUG = true;

const dir = path.join(process.cwd(), 'repo');
const encryptedDir = path.join(dir, '.git/encrypted');
const params = {
  fs,
  http,
  dir,
};

export const push = async () => {
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

  await Bluebird.each(objectIds, async oid => {
    const object = await git.readObject({ ...params, oid, format: 'wrapped' });
    const [filename, encrypted] = encrypt(
      object.oid,
      object.object as Uint8Array
    );
    await fs.promises.writeFile(path.join(encryptedDir, filename), encrypted);
  });
};

const pushCommand = program.createCommand('push');
pushCommand.action(async () => {
  push();
});

program.addCommand(pushCommand);

program.parse(process.argv);
