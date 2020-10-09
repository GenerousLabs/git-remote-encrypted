import { hash, secretbox, randomBytes } from 'tweetnacl';
import { decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';
import { arrayToHex } from 'enc-utils';

export type KEYS = {
  secret: Uint8Array;
  secretNonce: Uint8Array;
  filenames: Uint8Array;
  filenamesNonce: Uint8Array;
};
const DEFAULT_KEYS: KEYS = {
  secret: decodeBase64('OTdY2G5jOtUb4NkTIrcMic5Om2FSGVNr+mOV21bMfkY='),
  secretNonce: decodeBase64('wIfKspQFPMhcpxWSNO/d/aA50ErheC6t'),
  filenames: decodeBase64('aeFYzTwOrPbAPu7Lyw1QZ34JglphbLTgAAHtjr2Zcps='),
  filenamesNonce: decodeBase64('JbTmJEJIT3fx2agUFmLFkb0Zk60/Eeoa'),
};

const { nonceLength: NONCE_LENGTH } = secretbox;

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

export const objectIdToNonce = (objectId: string, nonceKey: Uint8Array) => {
  const combined = concat(decodeUTF8(objectId), nonceKey);
  const hashed = hash(combined);
  const [nonce] = split(hashed, NONCE_LENGTH);
  return nonce;
};

export const encryptFilename = (objectId: string, keys: KEYS) => {
  const nonce = objectIdToNonce(objectId, keys.filenamesNonce);
  const objectIdUint8Array = decodeUTF8(objectId);
  const box = secretbox(objectIdUint8Array, nonce, keys.filenames);
  const output = arrayToHex(box);
  return output;
};

export const encryptContents = (
  objectId: string,
  wrappedContent: Uint8Array,
  keys: KEYS
) => {
  const nonce = objectIdToNonce(objectId, keys.secretNonce);

  const box = secretbox(wrappedContent, nonce, keys.secret);

  return concat(nonce, box);
};

export const encrypt = (
  objectId: string,
  wrappedContent: Uint8Array,
  keys = DEFAULT_KEYS
): [string, Uint8Array] => {
  const filename = encryptFilename(objectId, keys);
  const content = encryptContents(objectId, wrappedContent, keys);
  return [filename, content];
};

export const decrypt = (encryptedContent: Uint8Array, keys = DEFAULT_KEYS) => {
  const [nonce, box] = split(encryptedContent, NONCE_LENGTH);

  const wrappedContent = secretbox(box, nonce, keys.secret);

  return wrappedContent;
};
