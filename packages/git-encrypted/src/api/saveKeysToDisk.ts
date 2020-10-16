import { keysToString } from '../keys';
import { GitBaseParamsEncrypted, KEYS } from '../types';
import {
  ensureDirectoryExists,
  getEncryptedKeysDir,
  getKeysPath,
} from '../utils';

export const saveKeysToDisk = async ({
  fs,
  gitdir,
  keys,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitdir'> & { keys: KEYS }) => {
  const keysDir = getEncryptedKeysDir({ gitdir });
  await ensureDirectoryExists({ fs, path: keysDir });

  const keysPath = getKeysPath({ gitdir });
  const keysString = keysToString({ keys });
  const json = JSON.stringify(keysString);
  await fs.promises.writeFile(keysPath, json, { encoding: 'utf8' });
};
