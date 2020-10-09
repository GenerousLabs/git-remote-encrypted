import { hash, secretbox, randomBytes } from 'tweetnacl';
import { decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

const key = decodeBase64('OTdY2G5jOtUb4NkTIrcMic5Om2FSGVNr+mOV21bMfkY=');
const noncePrefix =
  'jShpPOH6WR6ChqaMebGBNLzYi9OgQ9we1UilKYwNF2XBlU56odgEE5ZJstxns3Z';

export const generateKey = () => encodeBase64(randomBytes(secretbox.keyLength));

export const concat = (a: Uint8Array, b: Uint8Array) => {
  const length = a.length + b.length;
  const result = new Uint8Array(length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
};

export const encrypt = (objectId: string, wrappedContent: Uint8Array) => {
  // How do we
  const combinedHash = hash(decodeUTF8(`${noncePrefix}${objectId}`));

  const nonce = combinedHash.slice(0, secretbox.nonceLength);

  const box = secretbox(wrappedContent, nonce, key);

  return concat(nonce, box);
};

export const decrtypt = (encryptedContent: Uint8Array) => {
  const nonce = encryptedContent.slice(0, secretbox.nonceLength);
  const box = encryptedContent.slice(secretbox.nonceLength);

  const wrappedContent = secretbox(box, nonce, key);

  return wrappedContent;
};
