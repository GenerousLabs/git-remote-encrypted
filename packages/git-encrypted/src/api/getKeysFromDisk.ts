import { base64ToKeys } from '../keys';
import { GitBaseParams, KeysBase64 } from '../types';
import { getKeysPath } from '../utils';

export const getKeysFromDisk = async ({
  fs,
  gitdir,
}: Pick<GitBaseParams, 'fs' | 'gitdir'>) => {
  try {
    const keysPath = getKeysPath({ gitdir });
    const keysJson = await fs.promises.readFile(keysPath, 'utf8');
    // TODO Add validation here
    const keysString: KeysBase64 = JSON.parse(keysJson);
    const keys = base64ToKeys({ keysBase64: keysString });
    return keys;
  } catch (error) {
    console.error('FATAL: Failed to load keys. #TGIwoU');
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
      process.exit();
    }
    throw error;
  }
};
