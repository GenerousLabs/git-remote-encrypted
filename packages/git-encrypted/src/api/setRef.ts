import { commitAndPushEncryptedRepo } from '../git';
import { writeEncryptedRef } from '../refs';
import { EncryptedRemoteParams, GitBaseParamsEncrypted } from '../types';
import { getEncryptedDir } from '../utils';
import { getEncryptedRefObjectId } from './getEncryptedRefObjectId';

export const setEncryptedRef = async (
  params: GitBaseParamsEncrypted &
    EncryptedRemoteParams & {
      /**
       * The ref to fetch from the encrypted refs store.
       */
      ref: string;
      /**
       * The objectId (sha1) to set this ref to.
       */
      objectId: string;
    }
) => {
  const { gitdir } = params;
  const { ref, objectId, encryptedRemoteUrl, gitApi, ...base } = params;

  const encryptedDir = getEncryptedDir({ gitdir });

  // Before we read from the encrypted repo, we always try to pull
  await gitApi.pull({
    ...base,
    encryptedDir,
    encryptedRemoteUrl,
    // If this pull fails, we don't care, it's just a precaution.
    throwOnError: false,
  });

  const existingRefObjectId = await getEncryptedRefObjectId({ ...base, ref });

  if (existingRefObjectId === objectId) {
    return;
  }

  await writeEncryptedRef(params);

  await commitAndPushEncryptedRepo({ ...base, encryptedRemoteUrl, gitApi });
};
