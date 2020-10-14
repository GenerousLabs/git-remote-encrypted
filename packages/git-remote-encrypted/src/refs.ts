import { inflate } from 'pako';
/**
 * Refs are stored as a space separated list like so:
sha1 refs/heads/master
sha1 refs/heads/main
sha1 refs/heads/devel
 *
 * This is constructed as a text file and encrypted into the repo as if it were
 * a normal object, but with the object ID
 * '4b825dc642cb6eb9a060e54bf8d69288fbee4904' which is git's internal "empty"
 * repo fake commit. Hopefully there will never be a commit with this id!
 */
import { join } from 'path';
import { decodeUTF8, encodeUTF8 } from 'tweetnacl-util';
import { DEFAULT_KEYS, ENCRYPTED_DIR, REF_OID } from './constants';
import { decrypt, encryptFilename, KEYS } from './crypto';
import { encryptAndWriteFile, wrapAndDeflate } from './encrypted';
import { packageLog } from './log';
import { GitBaseParams } from './types';
import { doesFileExist, unwrap } from './utils';

type Ref = {
  ref: string;
  oid: string;
};
type Refs = {
  [ref: string]: string;
};

const log = packageLog.extend('refs');
const logNoisy = log.extend('noisy');

export const getRefFilename = ({ keys }: { keys: KEYS }) => {
  const encryptedFilename = encryptFilename(REF_OID, keys);
  return encryptedFilename;
};

export const getRefFilePath = ({ keys, dir }: { keys: KEYS; dir: string }) => {
  const encryptedFilename = getRefFilename({ keys });

  const filePath = join(dir, ENCRYPTED_DIR, encryptedFilename);

  return filePath;
};

export const refsToString = ({ refs }: { refs: Refs }) => {
  return Object.entries(refs)
    .map(pairs => {
      const [ref, oid] = pairs;
      return `${ref} ${oid}`;
    })
    .join('\n');
};

export const stringToRefs = ({ refsString }: { refsString: string }): Refs => {
  const refsEntries = refsString.split('\n').map(line => {
    return line.split(' ');
  });
  const refs = Object.fromEntries(refsEntries);
  return refs;
};

export const getRefs = async ({
  fs,
  dir,
}: Pick<GitBaseParams, 'fs' | 'dir'>) => {
  log('getRefs() invoked #g8kmwd', JSON.stringify({ dir }));

  const keys = DEFAULT_KEYS;

  const filePath = getRefFilePath({ dir, keys });

  if (!(await doesFileExist({ fs, path: filePath }))) {
    log('Refs file does not exist #Y1uGC4');
    // If the encrypted file does not exist, we assume there are no refs
    return {};
  }

  const encryptedContents: Uint8Array = await fs.promises.readFile(filePath);
  logNoisy('Got encrypted refs #l2dRa2', encryptedContents);
  const decryptedContents = decrypt(encryptedContents, keys);

  const inflatedAndWrapped = inflate(decryptedContents);
  logNoisy(
    'Got inflated and wrapped refs #5swSDA',
    inflatedAndWrapped,
    Buffer.from(inflatedAndWrapped).toString('utf8')
  );
  const { object: contentArray } = unwrap(inflatedAndWrapped);

  logNoisy('Got decrypted refs #l2dRa2', contentArray);
  const refsString = encodeUTF8(contentArray);
  // const refsString = Buffer.from(contentArray).toString('utf8');
  log('Got refs as string #UNkyIK', refsString);

  const refs = stringToRefs({ refsString });
  log('Returning refs #KLP85n', refs);

  return refs;
};

export const writeRefsFile = async ({ refsString }: { refsString: string }) => {
  const filenames = new Set<string>();

  const refsArray = decodeUTF8(refsString);
  logNoisy('writeRefsFile() refsArray #aGoHFY', refsArray);

  const deflatedContent = await wrapAndDeflate({
    objectType: 'refs',
    content: refsArray,
  });

  await encryptAndWriteFile({ oid: REF_OID, deflatedContent, filenames });

  const [filename] = Array.from(filenames.values());

  return filename;
};

export const setRef = async ({
  dir,
  fs,
  oid,
  ref,
}: Pick<GitBaseParams, 'dir' | 'fs'> & Ref) => {
  log('setRef() invoked #SULV9G', JSON.stringify({ ref, oid }));

  const keys = DEFAULT_KEYS;

  const existingRefs = await getRefs({ fs, dir });

  // If the ref is already set, nothing to do
  if (existingRefs[ref] === oid) {
    log('setRef() skipping existing ref #0fVMPA', JSON.stringify({ ref, oid }));
    return;
  }

  const newRefs = { ...existingRefs, [ref]: oid };

  const refsString = refsToString({ refs: newRefs });
  log('setRef() refsString #6phgMz', JSON.stringify(refsString));

  await writeRefsFile({ refsString });

  log('setRef() success #VjowIq', JSON.stringify({ ref, oid }));

  const filePath = getRefFilePath({ keys, dir });

  return filePath;
};
