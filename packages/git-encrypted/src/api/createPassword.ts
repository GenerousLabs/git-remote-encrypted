import { generateKey } from '../utils';

const PASSWORD_LENGTH = 12;

export const createPassword = () => {
  const key = generateKey(16);
  const alphanumericKey = key.replace(/[^\w]/g, '');
  const keyOfLength = alphanumericKey.substr(0, PASSWORD_LENGTH);
  return keyOfLength;
};
