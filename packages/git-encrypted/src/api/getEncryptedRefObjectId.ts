import { getEncryptedRefPairs } from '../refs';
import { GitBaseParamsWithGetKeys } from '../types';

export const getEncryptedRefObjectId = async (
  params: GitBaseParamsWithGetKeys & {
    /**
     * The ref to fetch from the encrypted refs store.
     */
    ref: string;
  }
) => {
  const { fs, gitdir, getKeys, ref } = params;
  const refsPairs = await getEncryptedRefPairs({ fs, gitdir, getKeys });
  const refPair = refsPairs.find(pair => {
    return pair[0] === ref;
  });

  if (typeof refPair === 'undefined') {
    return;
  }

  return refPair[1];
};
