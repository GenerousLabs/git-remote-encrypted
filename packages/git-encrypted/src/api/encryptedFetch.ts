import { copyAllEncryptedObjectsToSourceRepo } from '../objects';
import { EncryptedRemoteParams, GitBaseParamsEncrypted } from '../types';
import { getEncryptedDir } from '../utils';

/**
 * Update the encrypted repo and then copy all its objects into the source repo.
 */
export const encryptedFetch = async (
  params: GitBaseParamsEncrypted & EncryptedRemoteParams
) => {
  const { encryptedRemoteUrl, keys, fs } = params;
  const { gitdir, gitApi, ...base } = params;

  const encryptedDir = getEncryptedDir({ gitdir });

  // When the source repo is pulling from the encrypted repo, first we need to
  // pull from the encryptedRemote to ensure that we have the latest objects.
  await gitApi.pull({
    ...base,
    encryptedDir,
    encryptedRemoteUrl,
    // encryptedRemoteBranch: branch,
  });

  // Decrypt objects and load them into the source repo
  // TODO Decide how to decrypt objects
  // - We could decrypt one at a time, parse it, and then find its children
  // - We could also just decrypt every object we have
  await copyAllEncryptedObjectsToSourceRepo({ fs, gitdir, keys });
};
