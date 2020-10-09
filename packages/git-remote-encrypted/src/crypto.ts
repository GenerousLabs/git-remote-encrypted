import { hash, secretbox, randomBytes } from 'tweetnacl';
import { decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

const keys = {
  secret: decodeBase64('OTdY2G5jOtUb4NkTIrcMic5Om2FSGVNr+mOV21bMfkY='),
  nonce: decodeBase64('e2KCG0BRsBzZB441DkstnR7e+2BPU34Cc3mz3dQZA2s='),
  filenames: decodeBase64('aeFYzTwOrPbAPu7Lyw1QZ34JglphbLTgAAHtjr2Zcps='),
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

export const generateKey = () => encodeBase64(randomBytes(secretbox.keyLength));

export const objectIdToNonce = (objectId: string) => {
  const combined = concat(decodeUTF8(objectId), keys.nonce);
  const hashed = hash(combined);
  const [nonce] = split(hashed, NONCE_LENGTH);
  return nonce;
};

export const encrypt = (objectId: string, wrappedContent: Uint8Array) => {
  // How do we
  const nonce = objectIdToNonce(objectId);

  const box = secretbox(wrappedContent, nonce, keys.secret);

  return concat(nonce, box);
};

export const decrypt = (encryptedContent: Uint8Array) => {
  const [nonce, box] = split(encryptedContent, NONCE_LENGTH);

  const wrappedContent = secretbox(box, nonce, keys.secret);

  return wrappedContent;
};
