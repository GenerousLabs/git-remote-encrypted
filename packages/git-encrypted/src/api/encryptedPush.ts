import Bluebird from 'bluebird';
import {
  encryptedRepoCommit,
  getAllObjectIdsStartingAtCommit,
  getSourceObjectIdForRef,
} from '../git';
import { packageLog } from '../log';
import { copySourceObjectToEncryptedRepo } from '../objects';
import { GitBaseParamsEncrypted, PushRef, RemoteUrl } from '../types';
import { getEncryptedDir, parseGitRemoteUrl } from '../utils';
import { encryptedInit } from './encryptedInit';
import { getEncryptedRefObjectId } from './getRefObjectId';

const log = packageLog.extend('encryptedPush');

export enum EncryptedPushResult {
  nochange = 'nochange',
  success = 'success',
  error = 'error',
}

export const encryptedPush = async (
  params: GitBaseParamsEncrypted &
    RemoteUrl & {
      refs: PushRef[];
    }
) => {
  const { refs, gitdir, remoteUrl, getKeys } = params;
  const { gitApi, ...gitBaseParams } = params;
  const encryptedDir = getEncryptedDir({ gitdir });
  const { url: encryptedRemoteUrl } = parseGitRemoteUrl({ remoteUrl });

  log('Invoked #kGvMKs', JSON.stringify({ gitdir, encryptedRemoteUrl }));

  // We need to re-run the initialisation on every push because a user can `git
  // add remote ...` and then immediately `git push`. We have no way of knowing
  // if the encrypted repo has been initialised or not.
  await encryptedInit({
    ...params,
    encryptedRemoteUrl,
  });

  // Before we start running the PUSH, paradoxically, we need to first PULL. To
  // handle a push from the source repo into the encrypted repo we first need to
  // know that our encrypted repo is up to date.
  await gitApi.pull({
    ...gitBaseParams,
    encryptedDir,
    encryptedRemoteUrl,
    // NOTE: We do not want this operation to break the whole process. This pull
    // will fail if the encrypted repo was cloned from an empty encryptedRemote.
    throwOnError: false,
  });

  const objectIdsToCopyToEncrypted = new Set<string>();

  // TODO Add and encrypt objects
  // We're working with 2 repositories here. Each ref to be pushed contains 2
  // sides. The most common example is `refs/heads/master:refs/heads/master`
  // which arrives here like `src: 'refs/heads/master', dst:
  // 'refs/heads/master'`. We need to get the objectId of the
  // `refs/heads/master` commit in the soruce repo, and then copy all the
  // missing commits (plus all their linked objects) into the encrypted repo,
  // and then update the `refs/heads/master` ref to store the latest objectId.
  const results = await Bluebird.mapSeries(refs, async ref => {
    try {
      // TODO: Figure out how to reject force-pushes without the `force` flag set
      // to `true`
      const { src, dst } = ref;

      const srcCommitId = await getSourceObjectIdForRef({
        ...gitBaseParams,
        ref: src,
      });

      const dstCommitId = await getEncryptedRefObjectId({
        ...gitBaseParams,
        ref: dst,
      });

      // If the two commits have the same objectId then there's nothing to do
      // NOTE: This is unlikely, why did git ask us to make an empty push.
      // Something potentially went wrong here.
      if (srcCommitId === dstCommitId) {
        log('No change push #srBXGz', JSON.stringify({ gitdir, ref }));
        return { ...ref, result: EncryptedPushResult.nochange };
      }

      await getAllObjectIdsStartingAtCommit({
        ...gitBaseParams,
        startAtCommitId: srcCommitId,
        stopAtCommitId: dstCommitId,
        objectIds: objectIdsToCopyToEncrypted,
      });

      return { ...ref, result: EncryptedPushResult.success };
    } catch (error) {
      log('Error during source to encrypted push #cDTH0X', error);
      return { ...ref, result: EncryptedPushResult.error };
    }
  });

  // After checking all the requested push refs, copy any new objects
  if (objectIdsToCopyToEncrypted.size === 0) {
    // It's unlikely that we'll have found zero objects, if so, something
    // probably went wrong.
    log(
      'Found no new objects during encryptedPush() #Nj2g88',
      JSON.stringify({ gitdir, refs })
    );
    return results;
  }

  const keys = await getKeys();

  await Bluebird.each(objectIdsToCopyToEncrypted, async objectId => {
    await copySourceObjectToEncryptedRepo({ ...gitBaseParams, keys, objectId });
  });

  // TODO Do the git add, git commit here
  const newCommitToPush = await encryptedRepoCommit({
    ...gitBaseParams,
  });

  // This pushes the encrypted repo
  await gitApi.push({
    ...gitBaseParams,
    encryptedDir,
    encryptedRemoteUrl,
    // If there is no new commit to push, then we don't really care if this push
    // operation fails
    throwOnError: !newCommitToPush,
    // encryptedRemoteBranch,
  });

  return results;
};
