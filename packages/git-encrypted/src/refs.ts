import Bluebird from 'bluebird';
import { decryptedFilename, decryptFile } from './crypto';
import { GitBaseParams, GitBaseParamsEncrypted } from './types';
import { getEncryptedRefsDir } from './utils';

export const _getRefs = async ({
  fs,
  gitDir,
  getKeys,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitDir' | 'getKeys'>) => {
  const keys = await getKeys();
  const encryptedRefsDir = getEncryptedRefsDir({ gitDir });
  const encryptedRefFileNames = await fs.promises.readdir(encryptedRefsDir);
  const refPairs = await Bluebird.map(
    encryptedRefFileNames,
    async encryptedRefFilename => {
      const fileContents = await fs.promises.readFile(encryptedRefFilename);

      const [ref, objectId] = await decryptFile({
        fileContents,
        encryptedFilenameHex: encryptedRefFilename,
        keys,
      });

      return [ref, objectId];
    }
  );
};
