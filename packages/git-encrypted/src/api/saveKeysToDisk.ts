import { keysToBase64 } from '../keys';
import { GitBaseParamsEncrypted, Keys, KeysBase64 } from '../types';
import {
  ensureDirectoryExists,
  getEncryptedKeysDir,
  getKeysPath,
} from '../utils';

export const saveKeysToDisk = async (
  params: Pick<GitBaseParamsEncrypted, 'fs' | 'gitdir'> &
    (
      | { keys: Keys }
      | {
          keysBase64: KeysBase64;
        }
    )
) => {
  const { fs, gitdir } = params;

  const keysDir = getEncryptedKeysDir({ gitdir });
  const keysPath = getKeysPath({ gitdir });
  await ensureDirectoryExists({ fs, path: keysDir });

  const keysBase64 =
    'keysBase64' in params
      ? params.keysBase64
      : keysToBase64({ keys: params.keys });

  const json = JSON.stringify(keysBase64);

  await fs.promises.writeFile(keysPath, json, { encoding: 'utf8' });
};
