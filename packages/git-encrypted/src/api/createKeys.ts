import tweetnacl, { randomBytes } from 'tweetnacl';
import { KEYS } from '../types';

// This is unnecessarily async in case we want to use async random generation in
// the future.
export const createKeys = async (): Promise<KEYS> => {
  const content = randomBytes(tweetnacl.secretbox.keyLength);
  const filename = randomBytes(tweetnacl.secretbox.keyLength);
  const salt = randomBytes(tweetnacl.secretbox.keyLength);
  return { content, filename, salt };
};
