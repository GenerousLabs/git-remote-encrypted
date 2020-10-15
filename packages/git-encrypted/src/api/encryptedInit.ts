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
