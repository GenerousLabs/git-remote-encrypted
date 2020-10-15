import { mapValues } from 'remeda';
import { decodeUTF8, encodeUTF8 } from 'tweetnacl-util';
import { KEYS, KEYS_STRINGS } from './types';

export const stringToKeys = ({
  keysString,
}: {
  keysString: KEYS_STRINGS;
}): KEYS => {
  const keys = mapValues(keysString, decodeUTF8);
  return keys;
};

export const keysToString = ({ keys }: { keys: KEYS }): KEYS_STRINGS => {
  const keysString = mapValues(keys, encodeUTF8);
  return keysString;
};
