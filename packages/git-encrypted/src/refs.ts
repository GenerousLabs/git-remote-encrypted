import Bluebird from 'bluebird';
import { encodeUTF8 } from 'tweetnacl-util';
import { decryptFile } from './crypto';
import { GitBaseParamsEncrypted, RefPair } from './types';
import { getEncryptedRefsDir } from './utils';

export const refPairsToGitString = ({ refPairs }: { refPairs: RefPair[] }) => {
  return refPairs
    .map(pair => {
      // NOTE: The order in our RefPair array is ref objectId, but for git
      // output, we need to flip that.
      const [ref, objectId] = pair;
      return `${objectId} ${ref}`;
    })
    .join('\n');
};

export const getEncryptedRefPairs = async ({
  fs,
  gitdir,
  getKeys,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitdir' | 'getKeys'>) => {
  const keys = await getKeys();
  const encryptedRefsDir = getEncryptedRefsDir({ gitdir });
  const encryptedRefFileNames = await fs.promises.readdir(encryptedRefsDir);
  const refPairs = await Bluebird.map(
    encryptedRefFileNames,
    async encryptedRefFilename => {
      const fileContents = await fs.promises.readFile(encryptedRefFilename);

      const [ref, objectIdArray] = await decryptFile({
        fileContents,
        encryptedFilenameHex: encryptedRefFilename,
        keys,
      });
      const objectId = encodeUTF8(objectIdArray);

      return [ref, objectId] as [string, string];
    }
  );
  return refPairs;
};
