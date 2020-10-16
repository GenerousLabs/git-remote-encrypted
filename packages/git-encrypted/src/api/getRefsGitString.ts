import { packageLog } from '../log';
import { getEncryptedRefPairs, refPairsToGitString } from '../refs';
import { GitBaseParamsEncrypted, RemoteUrl } from '../types';
import { parseGitRemoteUrl } from '../utils';
import { encryptedInit } from './encryptedInit';

const log = packageLog.extend('getRefsGitString');

export const getRefsGitString = async (
  params: GitBaseParamsEncrypted & RemoteUrl
) => {
  const { remoteUrl } = params;
  const {
    url: encryptedRemoteUrl,
    // branch: encryptedRemoteBranch,
  } = parseGitRemoteUrl({ remoteUrl });
  await encryptedInit({ ...params, encryptedRemoteUrl });

  const refPairs = await getEncryptedRefPairs(params);
  const refsString = refPairsToGitString({ refPairs });

  log('Got refsString #E6a92D', JSON.stringify({ refPairs, refsString }));

  return refsString;
};
