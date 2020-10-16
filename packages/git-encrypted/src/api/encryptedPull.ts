import { GitBaseParamsEncrypted, RemoteUrl } from '../types';
import { getEncryptedDir, parseGitRemoteUrl } from '../utils';
import { encryptedInit } from './encryptedInit';

export const encryptedPull = async (
  params: GitBaseParamsEncrypted & RemoteUrl
) => {
  const { remoteUrl } = params;
  const { gitdir, gitApi, ...base } = params;

  const encryptedDir = getEncryptedDir({ gitdir });
  const { url: encryptedRemoteUrl } = parseGitRemoteUrl({ remoteUrl });

  // We need to re-run the initialisation on every push because a user can `git
  // add remote ...` and then immediately `git push`. We have no way of knowing
  // if the encrypted repo has been initialised or not.
  await encryptedInit({ ...params, encryptedRemoteUrl });

  // When the source repo is pulling from the encrypted repo, first we need to
  // pull from the encryptedRemote to ensure that we have the latest objects.
  await gitApi.pull({
    ...base,
    encryptedDir,
    encryptedRemoteUrl,
    // encryptedRemoteBranch: branch,
  });

  // Decrypt objects and load them into the source repo
};
