import { packageLog } from '../log';
import {
  EncryptedRemoteParams,
  FS,
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
import { saveKeysToDisk } from './saveKeysToDisk';

const log = packageLog.extend('encryptedInit');

// TODO1 Swap `../meta.ts` to `../encryptedMeta.ts`

// TODO1 Move this to `../meta.ts`
const creatEncryptedMeta = async (): Promise<EncryptedMeta> => {
  return {
    version: 1,
    derivationParams: {
      // TODO1 Generate a random salt
      salt: 'generatedrandomsalt',
      cpuCost: 1024,
      blockSize: 8,
      parallelizationCost: 1,
    },
  };
};

// TODO1 Move this to `../meta.ts`
const readMetaFromDisk = async ({
  fs,
  encryptedDir,
}: {
  fs: FS;
  encryptedDir: string;
}): Promise<EncryptedMeta> => {
  console.log('#SbXtKQ', fs, encryptedDir);
  // TODO1 Read from disk
  return {
    version: 1,
    derivationParams: {
      salt: 'salt',
      cpuCost: 8,
      blockSize: 1,
      parallelizationCost: 1,
    },
  };
};

// TODO1 Move this to `../meta.ts`
const writeMetaToEncryptedRepo = async ({
  fs,
  encryptedDir,
  meta,
}: {
  fs: FS;
  encryptedDir: string;
  meta: EncryptedMeta;
}) => {
  console.log('#3wQJK9', fs, encryptedDir, meta);
  // TODO1 Create file
  // TODO1 Create commit in `.git/encrypted` repo
};

// TODO1 Convert this to a zod schema, use that to validate the shape of the
// JSON after reading it from `encrypted.json`
export type EncryptedMeta = {
  version: 1;
  derivationParams: {
    salt: string;
    cpuCost: number;
    blockSize: number;
    parallelizationCost: number;
  };
};

// TODO1 Move this to `../meta.ts`
const ensureMetaExists = async ({
  fs,
  encryptedDir,
}: Pick<GitBaseParamsEncrypted, 'fs'> & {
  encryptedDir: string;
}): Promise<EncryptedMeta> => {
  const meta = await readMetaFromDisk({ fs, encryptedDir });
  if (typeof meta !== 'undefined') {
    return meta;
  }

  const metaToSave = await creatEncryptedMeta();
  await writeMetaToEncryptedRepo({ fs, encryptedDir, meta: metaToSave });
  return metaToSave;
};

// TODO1 Move this to `../crypto.ts`
const ensureKeysExist = async ({
  fs,
  gitdir,
  encryptedDir,
  encryptedKeysDir,
  keyDerivationPassword,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitdir'> & {
  encryptedDir: string;
  encryptedKeysDir: string;
  keyDerivationPassword?: string;
}) => {
  const encryptedKeysDirectoryExists = await doesDirectoryExist({
    fs,
    path: encryptedKeysDir,
  });

  if (encryptedKeysDirectoryExists) {
    return;
  }

  if (typeof keyDerivationPassword === 'undefined') {
    throw new Error(
      'Cannot initialise without key derivation password #xvoEqa'
    );
  }

  const meta = await ensureMetaExists({ fs, encryptedDir });

  const keys = deriveKeys({ ...meta.derivationParams, keyDerivationPassword });
  await saveKeysToDisk({ fs, gitdir, keys });
};

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
