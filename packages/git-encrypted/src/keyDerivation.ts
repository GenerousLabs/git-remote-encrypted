import { scrypt } from 'scrypt-js';

export const hash = async (password: string, salt: string) => {
  const passwordBuffer = Buffer.from(password.normalize('NFKC'));
  const saltBuffer = Buffer.from(salt.normalize('NFKC'));

  const N = 1024;
  const r = 8;
  const p = 1;
  const dkLen = 96;

  const hash = await scrypt(passwordBuffer, saltBuffer, N, r, p, dkLen);

  return hash;
};
