import { GitBaseParamsEncrypted, RemoteUrl } from '../types';
import { getEncryptedDir, parseGitRemoteUrl } from '../utils';
import { encryptedInit } from './encryptedInit';

export const encryptedPull = async (
  params: GitBaseParamsEncrypted & RemoteUrl
) => {
  const { fs, remoteUrl } = params;
  const { gitDir, gitPull, getKeys, ...base } = params;
  const encryptedDir = getEncryptedDir({ gitDir });
  const { url, branch } = parseGitRemoteUrl({ remoteUrl });
  await encryptedInit({ fs, gitDir });

  // Pull from the encryptedRemote
  await gitPull({
    ...base,
    encryptedDir,
    encryptedRemoteUrl: url,
    encryptedRemoteBranch: branch,
  });

  // Decrypt objects and load them into the source repo
};
