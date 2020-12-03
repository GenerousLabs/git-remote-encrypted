import { mapValues } from 'remeda';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { Keys, KeysBase64 } from './types';

export const base64ToKeys = ({
  keysBase64,
}: {
  keysBase64: KeysBase64;
}): Keys => {
  const keys = mapValues(keysBase64, decodeBase64);
  return keys;
};

export const keysToBase64 = ({ keys }: { keys: Keys }): KeysBase64 => {
  const keysString = mapValues(keys, encodeBase64);
  return keysString;
};
