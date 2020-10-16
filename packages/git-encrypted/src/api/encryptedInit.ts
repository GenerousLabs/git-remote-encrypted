import git from 'isomorphic-git';
import { DEFAULT_BRANCH_NAME } from '../constants';
import { packageLog } from '../log';
import { GitBaseParamsEncrypted } from '../types';
import {
  doesDirectoryExist,
  ensureDirectoryExists,
  getEncryptedDir,
  getEncryptedKeysDir,
} from '../utils';

const log = packageLog.extend('encryptedInit');

export const _initEncryptedRemote = async (
  params: GitBaseParams & EncryptedRemoteParams
) => {
  const { fs, gitDir } = params;
  const { encryptedRemoteUrl, encryptedRemoteBranch, ...base } = params;

  // In this context, we're working 100% in the encrypted repo, so set the
  // encrypted dir to dir for convenience.
  const dir = getEncryptedDir({ gitDir });

  log(
    'Setting encryptedRemote #9FObFR',
    JSON.stringify({ encryptedDir: dir, encryptedRemoteUrl })
  );

  const remotes = await git.listRemotes({ fs, dir });

  const encryptedRemote = remotes.find(
    remote => remote.remote === ENCRYPTED_REMOTE_NAME
  );

  if (typeof encryptedRemote === 'undefined') {
    // The remote does not exist, so create it now
    await git.addRemote({
      fs,
      dir,
      remote: ENCRYPTED_REMOTE_NAME,
      url: encryptedRemoteUrl,
      force: true,
    });

    // Does the target branch exist on the remote? If not, this could be an empty repo
    const remoteBranches = await git.listServerRefs({
      ...base,
      url: encryptedRemoteUrl,
    });

    const remoteBranch = remoteBranches.find(ref => {
      const branchName = ref.ref.replace('refs/heads/', '');
      return branchName === encryptedRemoteBranch;
    });

    if (typeof remoteBranch === 'undefined') {
      // This is a new remote repo, nothing else to do
      return;
    }
  }

  // NOTE: By passing `force: true` here, we can ensure that the remote url is
  // always overwritten
  await git.addRemote({
    fs,
    dir,
    remote: ENCRYPTED_REMOTE_NAME,
    url: encryptedRemoteUrl,
    force: true,
  });
};

/**
 * Create a new encrypted remote.
 */
export const encryptedInit = async ({
  fs,
  gitDir,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitDir'>) => {
  log('Invoked #rv3T39', JSON.stringify({ gitDir }));
  const encryptedKeysDir = getEncryptedKeysDir({ gitDir });
  await ensureDirectoryExists({ fs, path: encryptedKeysDir });

  const encryptedDir = getEncryptedDir({ gitDir });

  if (await doesDirectoryExist({ fs, path: encryptedDir })) {
    log('Repo was already initialised #Aq1RnX');
    return;
  }

  await ensureDirectoryExists({ fs, path: encryptedDir });

  await git.init({ fs, dir: encryptedDir, defaultBranch: DEFAULT_BRANCH_NAME });

  log('Successfully initialised encrypted repo #Gz9igq');
};
