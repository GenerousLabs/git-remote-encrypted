import Bluebird from 'bluebird';
import { program } from 'commander';
import createDebug from 'debug';
import fs from 'fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { deflate, inflate } from 'pako';
import path from 'path';
import { decrypt, encrypt } from './crypto';

/**
 * DO
 * - [x] Get all objects with format=deflated
 * - [ ] Figure out why we're pushing fewer objects
 */

const log = createDebug('index');

const dir = process.cwd();
const encryptedDir = path.join(dir, '.git/encrypted');
const params = {
  fs,
  http,
  dir,
};

/**
 * Wrap a git object. Prepend the object with the type, byte length, etc.
 */
const wrap = ({
  type,
  object,
}: {
  type: string;
  object: Uint8Array | Buffer;
}) => {
  return Buffer.concat([
    Buffer.from(`${type} ${object.byteLength.toString()}\x00`),
    Buffer.from(object),
  ]);
};

export const writeFile = async (filename: string, content: Uint8Array) => {
  return fs.promises.writeFile(path.join(encryptedDir, filename), content);
};

export const encryptAndWriteFile = async (
  oid: string,
  deflatedContent: Uint8Array
) => {
  const [filename, content] = encrypt(oid, deflatedContent as Uint8Array);
  await writeFile(filename, content);
};

const logWalk = log.extend('walk');
export const walkTreeForObjectIds = async (
  treeObjectId: string,
  objectIds: Set<string>
) => {
  if (objectIds.has(treeObjectId)) {
    return;
  }
  objectIds.add(treeObjectId);

  const tree = await git.readTree({ ...params, oid: treeObjectId });

  if (tree.oid !== treeObjectId) {
    // The tree was "peeled"
    console.error('Tree was peeled #cug3Jm', treeObjectId, tree);
  }

  await Bluebird.each(tree.tree, entry => {
    const { oid, type } = entry;

    if (objectIds.has(oid)) {
      if (__DEV__)
        logWalk(
          'Skipping tree entry #jvfF8r',
          oid,
          treeObjectId,
          objectIds.size
        );
      return;
    }
    objectIds.add(oid);

    if (type === 'tree') {
      walkTreeForObjectIds(oid, objectIds);
    }
  });
};

// This is unnecessarily async because the isomorphic-git inflate / deflate code
// can be async in the browser, so we mirror that here in the hope of
// maintaining better compatibility if we can get access to isomorphic-git's
// internal APIs instead of building our own.
export const wrapAndDeflate = async ({
  objectType,
  content,
}: {
  objectType: string;
  content: Uint8Array;
}) => {
  return deflate(wrap({ type: objectType, object: content }));
};

const logPush = log.extend('push');
export const push = async () => {
  if (__DEV__) logPush('dir #AGIM7a', params.dir);

  const objectIds = new Set<string>();

  const log = await git.log({ ...params });

  if (__DEV__) logPush('Log #T71dMA', log.length);

  await Bluebird.each(log, async logEntry => {
    const { oid: commitId } = logEntry;

    // If we've already seen this node, stop here
    if (objectIds.has(commitId)) {
      return;
    }
    objectIds.add(commitId);

    await walkTreeForObjectIds(logEntry.commit.tree, objectIds);
  });

  if (__DEV__) logPush('objectIds #kCmOHd', objectIds.size);

  await Bluebird.each(objectIds, async oid => {
    const obj = await git.readObject({
      ...params,
      oid,
      format: 'deflated',
    });

    if (obj.format === 'content') {
      const deflated = await wrapAndDeflate({
        objectType: obj.type,
        content: obj.object,
      });

      return encryptAndWriteFile(oid, deflated);
    }

    if (obj.format !== 'deflated') {
      console.error('Result neither deflated nor content #HOqcrW', obj);
      throw new Error('Result not deflated and not content #zNagK7');
    }

    return encryptAndWriteFile(oid, obj.object as Uint8Array);
  });
};

const pushCommand = program.createCommand('push');
pushCommand.action(async () => {
  await push();
});
program.addCommand(pushCommand);

const logPull = log.extend('pull');
export const pull = async () => {
  const files = await fs.promises.readdir(encryptedDir);

  await Bluebird.each(files, async file => {
    if (file === '.git') {
      return;
    }
    if (__DEV__) logPull('Got file #GRFGoJ', file);

    const contents = await fs.promises.readFile(
      path.join(encryptedDir, file),
      {}
    );

    const decrypted = await decrypt(contents);
    if (__DEV__) logPull('Decrypted #o4Jmke', decrypted.length, decrypted);

    // NOTE: The `inflate()` call is throwing...
    const inflated = inflate(decrypted);
    if (__DEV__) logPull('Inflated #Y8qAIG', inflated.length);

    const oid = await git.writeObject({
      ...params,
      object: inflated,
      format: 'wrapped',
    });

    if (__DEV__) logPull('Written object #eeDzNw', oid);
  });
};

const pullCommand = program.createCommand('pull');
pullCommand.action(async () => {
  await pull();
});
program.addCommand(pullCommand);

program.parseAsync(process.argv).catch(error => {
  console.error('program.parseAsync crashed #j1RanY');
  console.error(error);
});
