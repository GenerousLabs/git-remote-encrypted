import { randomBytes } from 'tweetnacl';
import { KEY_LENGTH_BYTES } from '../constants';
import { Keys } from '../types';

// This is unnecessarily async in case we want to use async random generation in
// the future.
export const createKeys = async (): Promise<Keys> => {
  const content = randomBytes(KEY_LENGTH_BYTES);
  const filename = randomBytes(KEY_LENGTH_BYTES);
  const salt = randomBytes(KEY_LENGTH_BYTES);
  return { content, filename, salt };
};
