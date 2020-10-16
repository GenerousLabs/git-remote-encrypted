import { isEmptyRepo } from '../git';
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
import { createKeys } from './createKeys';
import { saveKeysToDisk } from './saveKeysToDisk';

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
  params: Omit<GitBaseParamsEncrypted, 'keys'> & EncryptedRemoteParams
) => {
  const { fs, gitdir } = params;
  const { gitApi, ...base } = params;

  log('Invoked #rv3T39', JSON.stringify({ gitdir }));

  const encryptedDir = getEncryptedDir({ gitdir });
  const encryptedKeysDir = getEncryptedKeysDir({ gitdir });

  // Check if the directories exist BEFORE creating them
  const encryptedDirectoryExists = await doesDirectoryExist({
    fs,
    path: encryptedDir,
  });
  const encryptedKeysDirectoryExists = await doesDirectoryExist({
    fs,
    path: encryptedKeysDir,
  });

  await ensureDirectoryExists({ fs, path: encryptedDir });

  const encryptedGitDir = getEncryptedGitDir({ gitdir });

  // If the `encrypted/.git` directory exists, then we assume the repository has
  // already been initialised.
  if (await doesDirectoryExist({ fs, path: encryptedGitDir })) {
    log('Repo was already initialised #Aq1RnX');
    await ensureDirectoriesExist({ fs, gitdir });
    return;
  }

  await gitApi.clone({ ...base, encryptedDir });

  // If the directory did not exist, and we cloned an empty repo, then let's
  // create and save new keys now.
  if (!encryptedDirectoryExists && !encryptedKeysDirectoryExists) {
    if (await isEmptyRepo({ fs, gitdir: encryptedGitDir })) {
      const keys = await createKeys();
      await saveKeysToDisk({ fs, gitdir, keys });
      log('Creating a new set of keys #1QkKPD');
      console.error(
        'New keys created and saved to .git/encrypted-keys/keys.json. Back them up! #35GYES'
      );
    }
  }

  // NOTE: We need to run this AFTER the clone because otherwise git complains
  // of trying to clone into a not empty directory.
  await ensureDirectoriesExist({ fs, gitdir });
  log('Successfully initialised encrypted repo #Gz9igq');
};
