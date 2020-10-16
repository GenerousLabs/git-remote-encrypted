import { getEncryptedRefPairs } from '../refs';
import { GitBaseParamsWithKeys } from '../types';

export const getEncryptedRefObjectId = async (
  params: GitBaseParamsWithKeys & {
    /**
     * The ref to fetch from the encrypted refs store.
     */
    ref: string;
  }
) => {
  const { fs, gitdir, keys, ref } = params;
  const refsPairs = await getEncryptedRefPairs({ fs, gitdir, keys });
  const refPair = refsPairs.find(pair => {
    return pair[0] === ref;
  });

  if (typeof refPair === 'undefined') {
    return;
  }

  return refPair[1];
};
