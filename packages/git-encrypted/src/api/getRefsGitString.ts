import { packageLog } from '../log';
import { getEncryptedRefPairs, refPairsToGitString } from '../refs';
import { GitBaseOfflineParams, Keys } from '../types';

const log = packageLog.extend('getRefsGitString');

export const getRefsGitString = async (
  params: GitBaseOfflineParams & { keys: Keys }
) => {
  const refPairs = await getEncryptedRefPairs(params);
  const refsString = refPairsToGitString({ refPairs });

  log('Got refsString #E6a92D', JSON.stringify({ refPairs, refsString }));

  return refsString;
};
