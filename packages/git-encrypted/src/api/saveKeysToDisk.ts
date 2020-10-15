import { keysToString } from '../keys';
import { GitBaseParamsEncrypted, KEYS } from '../types';
import {
  ensureDirectoryExists,
  getEncryptedKeysDir,
  getKeysPath,
} from '../utils';

export const saveKeysToDisk = async ({
  fs,
  gitDir,
  keys,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitDir'> & { keys: KEYS }) => {
  const keysDir = getEncryptedKeysDir({ gitDir });
  ensureDirectoryExists({ fs, path: keysDir });

  const keysPath = getKeysPath({ gitDir });
  const keysString = keysToString({ keys });
  const json = JSON.stringify(keysString);
  await fs.promises.writeFile(keysPath, json, { encoding: 'utf8' });
};
