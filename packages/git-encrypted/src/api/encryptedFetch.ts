import { copyAllEncryptedObjectsToSourceRepo } from '../objects';
import { GitBaseParamsEncrypted, RemoteUrl } from '../types';
import { getEncryptedDir, parseGitRemoteUrl } from '../utils';

export const encryptedFetch = async (
  params: GitBaseParamsEncrypted & RemoteUrl
) => {
  const { remoteUrl, getKeys, fs } = params;
  const { gitdir, gitApi, ...base } = params;

  const encryptedDir = getEncryptedDir({ gitdir });
  const { url: encryptedRemoteUrl } = parseGitRemoteUrl({ remoteUrl });

  // When the source repo is pulling from the encrypted repo, first we need to
  // pull from the encryptedRemote to ensure that we have the latest objects.
  await gitApi.pull({
    ...base,
    encryptedDir,
    encryptedRemoteUrl,
    // encryptedRemoteBranch: branch,
  });

  const keys = await getKeys();

  // Decrypt objects and load them into the source repo
  // TODO Decide how to decrypt objects
  // - We could decrypt one at a time, parse it, and then find its children
  // - We could also just decrypt every object we have
  await copyAllEncryptedObjectsToSourceRepo({ fs, gitdir, keys });
};
