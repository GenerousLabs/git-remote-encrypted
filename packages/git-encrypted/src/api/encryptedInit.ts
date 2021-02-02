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
import { ensureKeysExist } from '../crypto';

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
 * Initialise an encrypted remote.
 *
 * Ensures the `.git/encrypted` and `.git/encrypted-keys` directories exist,
 * creates a new set of keys if required, and then clones the supplied remote
 * into the `.git/encrypted` directory.
 */
export const encryptedInit = async (
  params: Omit<GitBaseParamsEncrypted, 'keys'> &
    EncryptedRemoteParams & {
      /**
       * A passphrase that can be used to derive the encryption keys.
       *
       * NOTE: This must be provided if the `.git/encrypted-keys/keys.json`
       * file does not already contain the required keys.
       */
      keyDerivationPassword?: string;
    }
) => {
  const { fs } = params;
  const { gitApi, gitdir, ...base } = params;

  log('Invoked #rv3T39', JSON.stringify({ gitdir }));

  const encryptedDir = getEncryptedDir({ gitdir });
  const encryptedKeysDir = getEncryptedKeysDir({ gitdir });

  await ensureDirectoryExists({ fs, path: encryptedDir });

  const encryptedGitDir = getEncryptedGitDir({ gitdir });

  // If the `encrypted/.git` directory exists, then we assume the repository has
  // already been initialised.
  if (await doesDirectoryExist({ fs, path: encryptedGitDir })) {
    log('Repo was already initialised #Aq1RnX');
    await ensureDirectoriesExist({ fs, gitdir });

    // We always try to pull from `encryptedRemote` into `encrypted` on init so
    // as to be sure that our `list` command returns the latest refs available.
    await gitApi.pull({ ...base, encryptedDir });

    return;
  }

  await gitApi.clone({ ...base, encryptedDir });

  await ensureKeysExist({ fs, gitdir, encryptedDir, encryptedKeysDir });

  // NOTE: We need to run this AFTER the clone because otherwise git complains
  // of trying to clone into a not empty directory.
  await ensureDirectoriesExist({ fs, gitdir });
  log('Successfully initialised encrypted repo #Gz9igq');
};
