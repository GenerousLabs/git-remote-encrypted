import { GitBaseParamsEncrypted, RemoteUrl } from '../types';
import {
  doesDirectoryExist,
  getEncryptedDir,
  parseGitRemoteUrl,
} from '../utils';

export const encryptedPush = async (
  params: GitBaseParamsEncrypted &
    RemoteUrl & {
      srcRef: string;
      dstRef: string;
    }
) => {
  const { fs, gitDir, remoteUrl } = params;
  const { gitPush, getKeys, ...base } = params;
  const encryptedDir = getEncryptedDir({ gitDir });
  const { url, branch } = parseGitRemoteUrl({ remoteUrl });

  if (!(await doesDirectoryExist({ fs, path: encryptedDir }))) {
    throw new Error('Encrypted repo not yet initialised. #XUXEuD');
  }

  // TODO Add and encrypt objects

  // This pushes the encrypted repo
  await gitPush({
    ...base,
    encryptedDir,
    encryptedRemoteUrl: url,
    encryptedRemoteBranch: branch,
  });
};
