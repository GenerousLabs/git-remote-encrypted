import Bluebird from 'bluebird';
import { program } from 'commander';
import fs from 'fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { deflate, inflate } from 'pako';
import path from 'path';
import { GIT_ENCRYPTED_AUTHOR, GIT_ENCRYPTED_MESSAGE } from './constants';
import { decrypt, encrypt } from './crypto';
import { packageLog } from './log';
import { nodePush } from './nodePush';
import { getRefs } from './refs';
import { FS, GitBaseParams, Push } from './types';
import { wrap } from './utils';

/**
 * DO
 * - [x] Get all objects with format=deflated
 * - [x] Figure out why we're pushing fewer objects
 * - [x] Loop over all refs
 * - [x] Loop over all tags
 * - [x] Do not save any remote branches
 * - [-] Save and restore all refs
 *   - Refs are explicitly "pushed" to a remote
 * - [ ] Refactor to a remote helper
 */

// NOTE: This is the ref of an "empty" repo in regular git

const log = packageLog.extend('encrypted');

// TODO Change these to parameters which are passed in
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

export const encryptAndWriteFile = async ({
  oid,
  deflatedContent,
  filenames,
}: {
  oid: string;
  deflatedContent: Uint8Array;
  filenames: Set<string>;
}) => {
  const [filename, content] = encrypt(oid, deflatedContent as Uint8Array);
  filenames.add(filename);
  await writeFile(filename, content);
};

const logWalk = log.extend('walk');
const logWalkNoisy = logWalk.extend('noisy');
export const walkTreeForObjectIds = async (
  treeObjectId: string,
  objectIds: Set<string>
) => {
  if (objectIds.has(treeObjectId)) {
    if (__DEV__) logWalkNoisy('Skipping repeated tree #vxmCSG', treeObjectId);
    return;
  }
  objectIds.add(treeObjectId);

  const tree = await git.readTree({ ...params, oid: treeObjectId });

  if (tree.oid !== treeObjectId) {
    // The tree was "peeled"
    console.error('Tree was peeled #cug3Jm', treeObjectId, tree);
    throw new Error('Hit a peeled tree #DAyRHq');
  }

  await Bluebird.each(tree.tree, async entry => {
    const { oid, type } = entry;

    // NOTE: We delegate handling of tree entries to the
    // `walkTreeForObjectIds()` function, which means that we need to hand over
    // to it BEFORE we check if this object is already in the list, and so on.
    // Otherwise we add it to the list here, then pass it to be checked, by
    // which time it gets skipped.
    if (type === 'tree') {
      return walkTreeForObjectIds(oid, objectIds);
    }

    if (objectIds.has(oid)) {
      if (__DEV__)
        logWalkNoisy(
          'Skipping tree entry #jvfF8r',
          oid,
          treeObjectId,
          objectIds.size
        );
      return;
    }
    objectIds.add(oid);
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

const logRefs = log.extend('refs');
export const getAllRefNames = async () => {
  const localBranches = await git.listBranches({ ...params });

  const tags = await git.listTags({ ...params });

  const refs = localBranches.concat(tags);

  if (__DEV__) logRefs('Got refs #NhXU5L', refs);

  return refs;
};

const logPush = log.extend('push');
export const push = async () => {
  if (__DEV__) logPush('dir #AGIM7a', params.dir);

  const objectIds = new Set<string>();

  const refs = await getAllRefNames();

  await Bluebird.each(refs, async ref => {
    const expandedRef = await git.expandRef({ ...params, ref });
    if (__DEV__) logPush('Succefully expanded ref #cPB6D4', ref, expandedRef);

    const refCommitId = await git.resolveRef({ ...params, ref: expandedRef });
    if (__DEV__) logPush('Succefully resolved ref #eZGHj0', ref, refCommitId);

    // NOTE: Not all refs
    const log = await git.log({ ...params, ref: refCommitId });

    if (__DEV__) logPush('Log #T71dMA', ref, log.length);

    await Bluebird.each(log, async logEntry => {
      const { oid: commitId } = logEntry;

      // If we've already seen this node, stop here
      if (objectIds.has(commitId)) {
        return;
      }
      objectIds.add(commitId);

      await walkTreeForObjectIds(logEntry.commit.tree, objectIds);
    });
  });

  if (__DEV__)
    logPush(
      'objectIds #kCmOHd',
      // Convert the values into an array and then join them into a single
      // string, otherwise the debug output will trim the list to only 100
      // entries.
      Array.from(objectIds.values()).join('\n'),
      // Log this second so it's easier to see below the huge list
      objectIds.size
    );

  const filenames = new Set<string>();

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

      return encryptAndWriteFile({ oid, deflatedContent: deflated, filenames });
    }

    if (obj.format !== 'deflated') {
      console.error('Result neither deflated nor content #HOqcrW', obj);
      throw new Error('Result not deflated and not content #zNagK7');
    }

    return encryptAndWriteFile({
      oid,
      deflatedContent: obj.object as Uint8Array,
      filenames,
    });
  });

  // TODO Save the filenames here
};

const pushCommand = program.createCommand('push');
pushCommand.action(async () => {
  await push();
});
program.addCommand(pushCommand);

const logPull = log.extend('pull:noisy');
export const pull = async ({ dir, fs }: { dir: string; fs: FS }) => {
  const files: string[] = await fs.promises.readdir(encryptedDir);

  await Bluebird.each(files, async file => {
    if (file === '.git') {
      return;
    }
    if (__DEV__) logPull('Got file #GRFGoJ', file);

    const contents = await fs.promises.readFile(path.join(encryptedDir, file));

    const decrypted = await decrypt(contents);
    if (__DEV__) logPull('Decrypted #o4Jmke', decrypted.length, decrypted);

    // NOTE: The `inflate()` call is throwing...
    const inflated = inflate(decrypted);
    if (__DEV__) logPull('Inflated #Y8qAIG', inflated.length);

    const oid = await git.writeObject({
      fs,
      dir,
      object: inflated,
      format: 'wrapped',
    });

    if (__DEV__) logPull('Written object #eeDzNw', oid);
  });
};

const pullCommand = program.createCommand('pull');
pullCommand.action(async () => {
  await pull(params);
});
program.addCommand(pullCommand);

/*
program.parseAsync(process.argv).catch(error => {
  console.error('program.parseAsync crashed #j1RanY');
  console.error(error);
});
*/

export const encryptAndSaveObjects = async ({
  objectIds,
}: {
  objectIds: Set<string>;
}) => {
  const filenames = new Set<string>();

  await Bluebird.each(objectIds, async oid => {
    const obj = await git.readObject({
      ...params,
      oid,
      format: 'deflated',
    });

    if (obj.format === 'content') {
      const deflatedContent = await wrapAndDeflate({
        objectType: obj.type,
        content: obj.object,
      });

      return encryptAndWriteFile({ oid, deflatedContent, filenames });
    }

    if (obj.format !== 'deflated') {
      console.error('Result neither deflated nor content #HOqcrW', obj);
      throw new Error('Result not deflated and not content #zNagK7');
    }

    return encryptAndWriteFile({
      oid,
      deflatedContent: obj.object as Uint8Array,
      filenames,
    });
  });

  return { objectIds, filenames };
};

/**
 * Given a ref, expand it, resolve it, and then get all its nested objects and
 * add them to the encrypted repo remote.
 */
const logPushRef = log.extend('pushRef');
export const pushRef = async ({
  fs,
  dir,
  ignoreObjectIds,
  pushRef,
  stopAtRef,
}: {
  fs: FS;
  dir: string;
  pushRef: string;
  ignoreObjectIds: Set<string>;
  stopAtRef?: string;
}) => {
  //
  logPushRef('pushRef() #515X7u', ignoreObjectIds, pushRef, stopAtRef);
  const objectIds = new Set<string>();

  const expandedRef = await git.expandRef({ ...params, ref: pushRef });
  if (__DEV__)
    logPushRef('Succefully expanded ref #IbfNay', pushRef, expandedRef);

  const refCommitId = await git.resolveRef({ ...params, ref: expandedRef });
  if (__DEV__)
    logPushRef('Succefully resolved ref #TY3tfW', pushRef, refCommitId);

  // If we're trying to push, and we are already up to date, then stop here
  const refs = await getRefs({ fs, dir });
  const refObjectIds = Object.values(refs);

  // If the commit we want to push exists on any of our refs (branches, tags)
  // then we can safely skip it. That commit has already been pushed.
  if (refObjectIds.includes(refCommitId)) {
    logPushRef(
      'Skipping push which is already complete #smeIax',
      JSON.stringify({ pushRef, refCommitId })
    );
    return {
      objectIds: new Set<string>(),
      filenames: new Set<string>(),
      refCommitId,
    };
  }

  const log = await git.log({ ...params, ref: refCommitId });

  if (__DEV__) logPushRef('Got log #BoPmIA', pushRef, log.length);

  // TODO Figure out how only push new commits here
  // For example, we could stop when we see any of the commits from the refs
  // above.
  let reachedExistingRef = false;

  await Bluebird.each(log, async logEntry => {
    const { oid: commitId } = logEntry;

    // Once we reach this, nothing else to do, skip all other commits in the log
    if (reachedExistingRef) {
      return;
    }

    // If this commit is anywhere in our existing refs, then all its children
    // and parents have already been pushed, so we can safely stop traversing
    // the log history here.
    if (refObjectIds.includes(commitId)) {
      logPushRef(
        'Reached an existing commit #8mOmVZ',
        JSON.stringify({ pushRef, commitId })
      );
      reachedExistingRef = true;
      return;
    }

    // If we've already seen this node, stop here
    if (objectIds.has(commitId)) {
      return;
    }
    objectIds.add(commitId);

    await walkTreeForObjectIds(logEntry.commit.tree, objectIds);
  });

  const results = await encryptAndSaveObjects({ objectIds });

  return { ...results, refCommitId };
};

const logEncryptedRepoPush = log.extend('doEncryptedRepoPush');
export const doEncryptedRepoPush = async ({
  fs,
  http,
  encryptedDir,
  remoteUrl,
  push,
}: Omit<GitBaseParams, 'dir'> &
  EncryptedPushParams & {
    push: Push;
  }) => {
  const [url, branch = 'main'] = remoteUrl.split('#');
  logEncryptedRepoPush(
    'Pushing encrypted repo to upstream #WpIWTQ',
    JSON.stringify({ url, branch })
  );

  await push({ dir: encryptedDir, url, branch, fs, http });
};

type EncryptedPushParams = {
  /**
   * The path to the encrypted upstream git repository.
   */
  encryptedDir: string;
  /**
   * The remote URL provided from the native git client
   */
  remoteUrl: string;
};

const logE = log.extend('encryptedRepoAddAndPush');
const logENoisy = logE.extend('noisy');
export const encryptedRepoAddAndPush = async ({
  fs,
  http,
  encryptedDir,
  remoteUrl,
}: Omit<GitBaseParams, 'dir'> &
  EncryptedPushParams & {
    push: Push;
  }) => {
  logE('Invoked #qm8Cu0', JSON.stringify({ encryptedDir, remoteUrl }));

  // In the context of this function, all operations happen on the encrypted
  // repo, and so we pass `encryptedDir` as the param `dir` in all operations.
  const dir = encryptedDir;

  const status = await git.statusMatrix({ fs, dir });

  const filesWithChanges = await Bluebird.filter(status, async row => {
    const [filepath, headStatus, workdirStatus, stageStatus] = row;

    // If all status rows are 1, nothing to do, this file is up to date
    if (headStatus === 1 && workdirStatus === 1 && stageStatus === 1) {
      return false;
    }

    // If this file is not up to date in the index, add it to the index now
    if (stageStatus !== 2) {
      logENoisy('Adding file #PzrVZc', JSON.stringify({ filepath }));
      await git.add({ fs, dir, filepath });
    }

    return true;
  });

  if (filesWithChanges.length === 0) {
    logE('No upstream encrypted repo changes. #25zevW');
    // There are no files with changes, so nothing to do. We still do a push
    // anyway, in case previous pushes failed for any reason.
    await doEncryptedRepoPush({
      fs,
      http,
      encryptedDir,
      remoteUrl,
      push: nodePush,
    });
    return;
  }

  await git.commit({
    fs,
    dir,
    author: GIT_ENCRYPTED_AUTHOR,
    message: GIT_ENCRYPTED_MESSAGE,
  });

  logE('Created new encrypted repo commit #7SOC1A');

  await doEncryptedRepoPush({
    fs,
    http,
    encryptedDir,
    remoteUrl,
    push: nodePush,
  });

  logE('encryptedRepoAddAndPush() success #jXJ7PD');

  // TODO Figure out how to do the upstream push here
};
