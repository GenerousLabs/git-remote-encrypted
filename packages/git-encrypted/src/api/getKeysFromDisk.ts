import { stringToKeys } from '../keys';
import { GitBaseParams, KEYS_STRINGS } from '../types';
import { getKeysPath } from '../utils';

export const getKeysFromDisk = async ({
  fs,
  gitDir,
}: Pick<GitBaseParams, 'fs' | 'gitDir'>) => {
  const keysPath = getKeysPath({ gitDir });
  const keysJson = await fs.promises.readFile(keysPath, 'utf8');
  const keysString: KEYS_STRINGS = JSON.parse(keysJson);
  const keys = stringToKeys({ keysString });
  return keys;
};
