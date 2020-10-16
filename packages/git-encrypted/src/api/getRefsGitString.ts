import { getEncryptedRefPairs, refPairsToGitString } from '../refs';
import { GitBaseParamsEncrypted, RemoteUrl } from '../types';
import { parseGitRemoteUrl } from '../utils';
import { encryptedInit } from './encryptedInit';

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
  return refsString;
};
