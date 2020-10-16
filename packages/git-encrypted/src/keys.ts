import { mapValues } from 'remeda';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { KEYS, KEYS_STRINGS } from './types';

export const stringToKeys = ({
  keysString,
}: {
  keysString: KEYS_STRINGS;
}): KEYS => {
  const keys = mapValues(keysString, decodeBase64);
  return keys;
};

export const keysToString = ({ keys }: { keys: KEYS }): KEYS_STRINGS => {
  const keysString = mapValues(keys, encodeBase64);
  return keysString;
};
