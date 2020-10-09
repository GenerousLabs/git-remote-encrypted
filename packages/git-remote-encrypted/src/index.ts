import Bluebird from 'bluebird';
import { program } from 'commander';
import fs from 'fs';
import git, { WrappedObject } from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import path from 'path';
import { decodeUTF8 } from 'tweetnacl-util';
import { encrypt } from './crypto';

const DEBUG = true;

const dir = process.cwd();
const encryptedDir = path.join(dir, '.git/encrypted');
const params = {
  fs,
  http,
  dir,
};

export const writeFile = async (filename: string, content: Uint8Array) => {
  return fs.promises.writeFile(path.join(encryptedDir, filename), content);
};

export const walkTree = async (
  treeObjectId: string,
  objectIds: Set<string>,
  walkedTrees: Set<string>
) => {
  if (walkedTrees.has(treeObjectId)) {
    return;
  }

  const result = await git.readTree({ ...params, oid: treeObjectId });

  // Add this tree to the set of walked trees so we can skip it in future
  walkedTrees.add(treeObjectId);

  await Bluebird.each(result.tree, async branch => {
    const { oid, type } = branch;
    if (type === 'blob') {
      objectIds.add(oid);
    } else if (type === 'tree') {
      await walkTree(oid, objectIds, walkedTrees);
    } else if (type === 'commit') {
      throw new Error('Found commit while walking tree #fhvQDB');
    }
  });
};

export const push = async () => {
  if (DEBUG) console.log('dir #AGIM7a', params.dir);

  // Record which commits have already been saved
  const commits = new Set<string>();
  const trees = new Set<string>();
  const blobIds = new Set<string>();
  const walkedTrees = new Set<string>();

  const log = await git.log({ ...params });

  if (DEBUG) console.log('Log #T71dMA', log.length);

  await Bluebird.each(log, async logEntry => {
    const [filename, content] = encrypt(
      logEntry.oid,
      decodeUTF8(logEntry.payload)
    );
    await writeFile(filename, content);
    commits.add(logEntry.oid);
    trees.add(logEntry.commit.tree);
  });

  await Bluebird.each(trees, async treeObjectId => {
    await walkTree(treeObjectId, blobIds, walkedTrees);
  });

  if (DEBUG)
    console.log(
      'Blob count',
      blobIds.size,
      'Tree count',
      walkedTrees.size,
      'Commit count',
      commits.size,
      '#Nzk9nr'
    );

  await Bluebird.each(walkedTrees, async treeId => {
    const tree = (await git.readObject({
      ...params,
      oid: treeId,
      format: 'deflated',
    })) as WrappedObject;
    const [filename, encrypted] = encrypt(treeId, tree.object);
    await writeFile(filename, encrypted);
  });

  await Bluebird.each(blobIds, async blobId => {
    const blob = await git.readBlob({ ...params, oid: blobId });
    const [filename, encrypted] = encrypt(blobId, blob.blob);
    await writeFile(filename, encrypted);
  });
};

const pushCommand = program.createCommand('push');
pushCommand.action(async () => {
  await push();
});

program.addCommand(pushCommand);

program.parseAsync(process.argv).catch(error => {
  console.error('program.parseAsync crashed #j1RanY');
  console.error(error);
});
