import Bluebird from 'bluebird';
import {
  commitAndPushEncryptedRepo,
  getAllObjectIdsStartingAtCommit,
  getSourceObjectIdForRef,
} from '../git';
import { packageLog } from '../log';
import { copySourceObjectToEncryptedRepo } from '../objects';
import { writeEncryptedRef } from '../refs';
import {
  EncryptedRemoteParams,
  GitBaseParamsEncrypted,
  PushRef,
} from '../types';
import { getEncryptedDir } from '../utils';
import { getEncryptedRefObjectId } from './getEncryptedRefObjectId';

const log = packageLog.extend('encryptedPush');

export enum EncryptedPushResult {
  nochange = 'nochange',
  success = 'success',
  error = 'error',
}

/**
 * Given a source repo, update the encrypted repo, then copy any missing
 * objects from source into encrypted, and push encrypted to its remote.
 */
export const encryptedPush = async (
  params: GitBaseParamsEncrypted &
    EncryptedRemoteParams & {
      refs: PushRef[];
    }
) => {
  const { gitdir, keys } = params;
  const { gitApi, encryptedRemoteUrl, refs, ...gitBaseParams } = params;
  const encryptedDir = getEncryptedDir({ gitdir });

  log('Invoked #kGvMKs', JSON.stringify({ gitdir, encryptedRemoteUrl }));

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
  const results = await Bluebird.mapSeries(
    refs,
    async (
      ref
    ): Promise<
      | (PushRef & {
          result: EncryptedPushResult.error;
        })
      | (PushRef & {
          result: EncryptedPushResult.nochange | EncryptedPushResult.success;
          srcCommitId: string;
        })
    > => {
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
          return {
            ...ref,
            srcCommitId,
            result: EncryptedPushResult.nochange,
          };
        }

        await getAllObjectIdsStartingAtCommit({
          ...gitBaseParams,
          startAtCommitId: srcCommitId,
          stopAtCommitId: dstCommitId,
          objectIds: objectIdsToCopyToEncrypted,
        });

        return {
          ...ref,
          srcCommitId,
          result: EncryptedPushResult.success,
        };
      } catch (error) {
        log('Error during source to encrypted push #cDTH0X', error);
        return { ...ref, result: EncryptedPushResult.error };
      }
    }
  );

  // If the operation succeeded, then write the encrypted ref
  const writeRefsAndCommitAndPush = async () => {
    await Bluebird.each(results, result => {
      if (result.result !== EncryptedPushResult.error) {
        writeEncryptedRef({
          ...gitBaseParams,
          ref: result.dst,
          objectId: result.srcCommitId,
        });
      }
    });

    await commitAndPushEncryptedRepo({
      ...gitBaseParams,
      gitApi,
      encryptedRemoteUrl,
    });
  };

  const errors = await Bluebird.filter(results, result => {
    return result.result === EncryptedPushResult.error;
  });
  if (errors.length > 0) {
    throw new Error('Error during encryptedPush() #jpFpwy');
  }

  // After checking all the requested push refs, copy any new objects
  if (objectIdsToCopyToEncrypted.size === 0) {
    // It's unlikely that we'll have found zero objects, if so, something
    // probably went wrong.
    log(
      'Found no new objects during encryptedPush() #Nj2g88',
      JSON.stringify({ gitdir, refs })
    );
    await writeRefsAndCommitAndPush();
    return results;
  }

  await Bluebird.each(objectIdsToCopyToEncrypted, async objectId => {
    await copySourceObjectToEncryptedRepo({ ...gitBaseParams, keys, objectId });
  });
  await writeRefsAndCommitAndPush();

  return results;
};
