import { packageLog } from '../log';
import {
  EncryptedRemoteParams,
  GitBaseParams,
  GitBaseParamsEncrypted,
} from '../types';
import {
  doesDirectoryExist,
  ensureDirectoryExists,
  getEncryptedDir,
  getEncryptedGitDir,
  getEncryptedKeysDir,
  getEncryptedObjectsDir,
  getEncryptedRefsDir,
} from '../utils';

const log = packageLog.extend('encryptedInit');

const ensureDirectoriesExist = async ({
  fs,
  gitdir,
}: Pick<GitBaseParams, 'fs' | 'gitdir'>) => {
  const encryptedObjectsDir = getEncryptedObjectsDir({ gitdir });
  await ensureDirectoryExists({ fs, path: encryptedObjectsDir });

  const encryptedKeysDir = getEncryptedKeysDir({ gitdir });
  await ensureDirectoryExists({ fs, path: encryptedKeysDir });

  const encryptedRefsDir = getEncryptedRefsDir({ gitdir });
  await ensureDirectoryExists({ fs, path: encryptedRefsDir });
};

/**
 * Create a new encrypted remote.
 */
export const encryptedInit = async (
  params: GitBaseParamsEncrypted & EncryptedRemoteParams
) => {
  const { fs, gitdir } = params;
  const { gitApi, getKeys, ...base } = params;

  log('Invoked #rv3T39', JSON.stringify({ gitdir }));

  const encryptedDir = getEncryptedDir({ gitdir });
  await ensureDirectoryExists({ fs, path: encryptedDir });

  const encryptedGitDir = getEncryptedGitDir({ gitdir });

  // TODO Add key init here

  // If the `encrypted/.git` directory exists, then we assume the repository has
  // already been initialised.
  if (await doesDirectoryExist({ fs, path: encryptedGitDir })) {
    log('Repo was already initialised #Aq1RnX');
    await ensureDirectoriesExist({ fs, gitdir });
    return;
  }

  await gitApi.clone({ ...base, encryptedDir });

  // NOTE: We need to run this AFTER the clone because otherwise git complains
  // of trying to clone into a not empty directory.
  await ensureDirectoriesExist({ fs, gitdir });
  log('Successfully initialised encrypted repo #Gz9igq');
};
