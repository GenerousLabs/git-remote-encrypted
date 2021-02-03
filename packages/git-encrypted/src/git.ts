import Bluebird from 'bluebird';
import git, { ReadCommitResult } from 'isomorphic-git';
import { last } from 'remeda';
import { GIT_ENCRYPTED_AUTHOR, GIT_ENCRYPTED_MESSAGE } from './constants';
import { packageLog } from './log';
import {
  EncryptedRemoteParams,
  GitBaseOfflineParams,
  GitBaseParams,
  GitBaseParamsEncrypted,
} from './types';
import { getEncryptedDir } from './utils';

/**
 * How many log messages to get on each recurisve operation
 */
const LOG_MESSAGE_CHUNKS = 10;

const log = packageLog.extend('git');

export const getSourceObjectIdForRef = async (
  params: GitBaseParams & { ref: string }
) => {
  const { ref, ...base } = params;
  log(
    'getSourceObjectIdForRef() #akt49K',
    JSON.stringify({ ref, gitdir: params.gitdir })
  );
  const expandedRef = await git.expandRef({ ...base, ref });
  const refCommitId = await git.resolveRef({ ...base, ref: expandedRef });
  return refCommitId;
};

export const getTreeObjectIdForCommit = async (
  params: GitBaseParams & { commitId: string }
) => {
  const { commitId, ...base } = params;
  const commit = await git.readCommit({ ...base, oid: commitId });
  return commit.commit.tree;
};

const logCommits = log.extend('getCommitLog');

export const getCommitLog = async (
  params: GitBaseParams & { startAtCommitId: string; stopAtCommitId?: string }
): Promise<ReadCommitResult[]> => {
  const { startAtCommitId, stopAtCommitId, ...base } = params;
  if (startAtCommitId === stopAtCommitId) {
    return [];
  }

  const getFullLogImmediately =
    typeof stopAtCommitId === 'undefined' || stopAtCommitId === '';

  const logs = await git.log({
    ...base,
    ref: startAtCommitId,
    depth: getFullLogImmediately ? undefined : LOG_MESSAGE_CHUNKS,
  });

  if (logs.length === 0) {
    return [];
  }

  if (getFullLogImmediately) {
    return logs;
  }

  const stopAtCommitIndex = logs.findIndex(log => {
    return log.oid === stopAtCommitId;
  });

  if (stopAtCommitIndex !== -1) {
    logCommits('Found matching stop commit #J96hA2');
    return logs.slice(0, stopAtCommitIndex);
  }

  const lastLog = last(logs) as ReadCommitResult;
  const lastCommitId = lastLog.oid;

  logCommits('Recursively getting more logs #NyDDi3');
  const nestedLogs = await getCommitLog({
    ...base,
    startAtCommitId: lastCommitId,
    stopAtCommitId,
  });

  // The `nestedLogs` array will start with our last commit, so that commit will
  // be duplicated. We trim that off here.
  const extraLogs = nestedLogs.slice(1);

  return logs.concat(extraLogs);
};

const logWalk = log.extend('walk');
const logWalkNoisy = logWalk.extend('noisy');

export const walkTreeForObjectIds = async (
  params: GitBaseParams & { treeObjectId: string; objectIds: Set<string> }
) => {
  const { objectIds } = params;
  const { treeObjectId, ...baseParmas } = params;
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
      return walkTreeForObjectIds({ ...baseParmas, treeObjectId: oid });
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

export const logGetAllObjects = log.extend('getAllObjects');
export const getAllObjectIdsStartingAtCommit = async (
  params: GitBaseParams & {
    startAtCommitId: string;
    stopAtCommitId?: string;
    /**
     * A Set() to which all the object IDs will be added. Can be empty or not.
     */
    objectIds: Set<string>;
  }
) => {
  const { startAtCommitId, stopAtCommitId, objectIds, ...base } = params;
  logGetAllObjects(
    'Invoked #F2orGO',
    JSON.stringify({ startAtCommitId, stopAtCommitId })
  );

  const logs = getCommitLog(params);

  // Push every object ID that we want to copy into the `objectIds` Set
  await Bluebird.each(logs, async log => {
    objectIds.add(log.oid);
    await walkTreeForObjectIds({
      ...base,
      treeObjectId: log.commit.tree,
      objectIds,
    });
  });

  return objectIds;
};

export const isEmptyRepo = async ({ fs, gitdir }: GitBaseOfflineParams) => {
  try {
    await git.log({ fs, gitdir, depth: 1 });
  } catch (error) {
    if (error instanceof git.Errors.NotFoundError) {
      return true;
    }
  }
  return false;
};

const logE = log.extend('encryptedRepoAddAndPush');
const logENoisy = logE.extend('noisy');

/**
 * `git add . && git commit` on the encrypted repo
 * @returns boolean True if a new commit was created, false if not
 */
export const encryptedRepoCommit = async (params: GitBaseOfflineParams) => {
  const { fs, gitdir } = params;

  // In the context of this function, all operations happen on the encrypted
  // repo, and so we pass `encryptedDir` as the param `dir` in all operations.
  const dir = getEncryptedDir({ gitdir });

  logE('Invoked #qm8Cu0', JSON.stringify({ gitdir }));

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
    logE('No upstream encrypted repo changes. #RmdueK');
    return false;
  }

  await git.commit({
    fs,
    dir,
    author: GIT_ENCRYPTED_AUTHOR,
    message: GIT_ENCRYPTED_MESSAGE,
  });

  logE('Created new encrypted repo commit #7SOC1A');

  return true;
};

export const commitAndPushEncryptedRepo = async (
  params: Omit<GitBaseParamsEncrypted, 'getKeys'> & EncryptedRemoteParams
) => {
  const { gitdir } = params;
  const { gitApi, ...base } = params;

  // TODO Do the git add, git commit here
  const newCommitToPush = await encryptedRepoCommit(base);

  const encryptedDir = getEncryptedDir({ gitdir });

  // This pushes the encrypted repo
  await gitApi.push({
    ...base,
    encryptedDir,
    // If there is no new commit to push, then we don't really care if this push
    // operation fails
    throwOnError: !newCommitToPush,
    // encryptedRemoteBranch,
  });
};
