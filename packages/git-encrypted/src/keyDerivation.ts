import { scrypt } from 'scrypt-js';
import { Keys } from './types';

export const deriveKey = async ({
  password,
  salt,
  cpuCost,
  blockSize,
  parallelizationCost,
  keyLength
}: {
  password: string;
  salt: string;
  cpuCost: number;
  blockSize: number;
  parallelizationCost: number;
  keyLength: number;
}): Promise<Uint8Array> => {
  const passwordBuffer = Buffer.from(password.normalize('NFKC'));
  const saltBuffer = Buffer.from(salt.normalize('NFKC'));

  return await scrypt(
    passwordBuffer,
    saltBuffer,
    cpuCost,
    blockSize,
    parallelizationCost,
    keyLength
  );
};

export const deriveKeys = async ({
  password,
  salt,
  cpuCost,
  blockSize,
  parallelizationCost
}: {
  password: string;
  salt: string;
  cpuCost: number;
  blockSize: number;
  parallelizationCost: number;
}): Promise<Keys> => {
  const keyLength = 96;
  const derivedKey = await deriveKey({
    password,
    salt,
    cpuCost,
    blockSize,
    parallelizationCost,
    keyLength
  });

  return {
    content: derivedKey.slice(0, 32),
    filename: derivedKey.slice(32, 64),
    salt: derivedKey.slice(64, 96)
  };
};
