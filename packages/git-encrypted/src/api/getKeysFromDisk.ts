import { stringToKeys } from '../keys';
import { GitBaseParams, KEYS_STRINGS } from '../types';
import { getKeysPath } from '../utils';

export const getKeysFromDisk = async ({
  fs,
  gitdir,
}: Pick<GitBaseParams, 'fs' | 'gitdir'>) => {
  try {
    const keysPath = getKeysPath({ gitdir });
    const keysJson = await fs.promises.readFile(keysPath, 'utf8');
    const keysString: KEYS_STRINGS = JSON.parse(keysJson);
    const keys = stringToKeys({ keysString });
    return keys;
  } catch (error) {
    console.error('FATAL: Failed to load keys. #TGIwoU');
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
      process.exit();
    }
    throw error;
  }
};
