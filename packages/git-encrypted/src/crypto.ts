import { arrayToHex, hexToArray } from 'enc-utils';
import { hash, randomBytes, secretbox } from 'tweetnacl';
import { decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';
import { NONCE_LENGTH } from './constants';
import { Keys, GitBaseParamsEncrypted } from './types';
import { doesDirectoryExist } from './utils';
import { deriveKeys } from './keyDerivation';
import { saveKeysToDisk } from './api/saveKeysToDisk';
import { ensureMetaExists } from './encryptedMeta';

export const concat = (a: Uint8Array, b: Uint8Array) => {
  const length = a.length + b.length;
  const result = new Uint8Array(length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
};

export const split = (combined: Uint8Array, length: number) => {
  const a = combined.slice(0, length);
  const b = combined.slice(length);
  return [a, b];
};

export const generateKey = (length: number) =>
  encodeBase64(randomBytes(length));

/**
 * Given an input and a salt, combine them into an nonce of the correct length.
 * This is a deterministic operation.
 *
 * NOTE: Any feedback from cryptographers welcome here. This might be a
 * terrible idea.
 */
export const createNonce = async ({
  salt,
  input,
}: {
  salt: Uint8Array;
  input: Uint8Array;
}) => {
  const combined = concat(input, salt);
  const hashed = hash(combined);
  const [nonce] = split(hashed, NONCE_LENGTH);
  return nonce;
};

// Copy the same API as secretbox
export const encrypt = async (
  msg: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
) => {
  const result = secretbox(msg, nonce, key);
  return result;
};

// Copy the same API as secretbox.open
export const decrypt = async (
  box: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
) => {
  const decrypted = secretbox.open(box, nonce, key);
  if (decrypted === null) {
    throw new Error('Decryption failed. #FxljFi');
  }
  return decrypted;
};

/**
 * Given a cleartext filename, calculate the encrypted filename
 *
 * NOTE: This cannot be decrypted. The nonce will be lost. `encryptFile()`
 * saves the nonce into the file body.
 */
export const encryptFilename = async ({
  filenameArray,
  keys,
  nonce,
}: {
  filenameArray: Uint8Array;
  nonce: Uint8Array;
  keys: Keys;
}) => {
  const encryptedFilenameArray = await encrypt(
    filenameArray,
    nonce,
    keys.filename
  );
  const encryptedFilenameHex = arrayToHex(encryptedFilenameArray);
  return encryptedFilenameHex;
};

/**
 * Given a cleartext filename and a contents, create an nonce then use that to
 * encrypt the filename, encrypt the file contents, and combine the nonce and
 * encrypted file contents, returning both the encrypted filename (hex encoded)
 * and the encrypted body combined with the nonce.
 */
export const encryptFile = async ({
  filename,
  contents,
  keys,
}: {
  filename: string;
  contents: Uint8Array;
  keys: Keys;
}): Promise<[string, Uint8Array]> => {
  const filenameArray = decodeUTF8(filename);
  const nonce = await createNonce({ salt: keys.salt, input: filenameArray });

  const encryptedFilenameHex = await encryptFilename({
    filenameArray,
    keys,
    nonce,
  });

  const encryptedContents = await encrypt(contents, nonce, keys.content);
  const noncePlusEncryptedContent = concat(nonce, encryptedContents);

  return [encryptedFilenameHex, noncePlusEncryptedContent];
};

export const decryptFile = async ({
  fileContents,
  encryptedFilenameHex,
  keys,
}: {
  encryptedFilenameHex: string;
  fileContents: Uint8Array;
  keys: Keys;
}): Promise<[string, Uint8Array]> => {
  const [nonce, encryptedContents] = split(fileContents, NONCE_LENGTH);

  const encryptedFilenameArray = hexToArray(encryptedFilenameHex);
  const decryptedFilenameArray = await decrypt(
    encryptedFilenameArray,
    nonce,
    keys.filename
  );
  const decryptedFilename = encodeUTF8(decryptedFilenameArray);

  const decryptedContents = await decrypt(
    encryptedContents,
    nonce,
    keys.content
  );

  return [decryptedFilename, decryptedContents];
};

export const decryptFileContentsOnly = async ({
  fileContents,
  keys,
}: {
  fileContents: Uint8Array;
  keys: Keys;
}) => {
  const [nonce, encryptedContents] = split(fileContents, NONCE_LENGTH);

  const decryptedContents = await decrypt(
    encryptedContents,
    nonce,
    keys.content
  );

  return decryptedContents;
};

export const ensureKeysExist = async ({
  fs,
  gitdir,
  encryptedDir,
  encryptedKeysDir,
  keyDerivationPassword,
}: Pick<GitBaseParamsEncrypted, 'fs' | 'gitdir'> & {
  encryptedDir: string;
  encryptedKeysDir: string;
  keyDerivationPassword?: string;
}) => {
  const encryptedKeysDirectoryExists = await doesDirectoryExist({
    fs,
    path: encryptedKeysDir,
  });

  if (encryptedKeysDirectoryExists) {
    return;
  }

  if (typeof keyDerivationPassword === 'undefined') {
    throw new Error(
      'Cannot initialise without key derivation password #xvoEqa'
    );
  }

  const meta = await ensureMetaExists({ fs, encryptedDir });

  const keys = await deriveKeys({ ...meta.derivationParams, password: keyDerivationPassword });
  await saveKeysToDisk({ fs, gitdir, keys });
};