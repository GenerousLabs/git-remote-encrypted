import { packageLog } from '../log';
import { getEncryptedRefPairs } from '../refs';
import { GitBaseParamsWithKeys } from '../types';

const log = packageLog.extend('getEncryptedRefObjectId');

export const getEncryptedRefObjectId = async (
  params: GitBaseParamsWithKeys & {
    /**
     * The ref to fetch from the encrypted refs store.
     */
    ref: string;
  }
) => {
  const { fs, gitdir, keys, ref } = params;

  log('Invoked #yxfFHO', JSON.stringify({ params }));

  const refsPairs = await getEncryptedRefPairs({ fs, gitdir, keys });

  const refPair = refsPairs.find(pair => {
    return pair[0] === ref;
  });

  if (typeof refPair === 'undefined') {
    return;
  }

  return refPair[1];
};
