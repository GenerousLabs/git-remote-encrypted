import { scrypt } from 'scrypt-js';

export const hash = async ({
  password,
  salt,
  cpuCost,
  blockSize,
  parallelizationCost,
}: {
  password: string;
  salt: string;
  cpuCost: number;
  blockSize: number;
  parallelizationCost: number;
}) => {
  const passwordBuffer = Buffer.from(password.normalize('NFKC'));
  const saltBuffer = Buffer.from(salt.normalize('NFKC'));
  const keyLength = 96;

  const hash = await scrypt(
    passwordBuffer,
    saltBuffer,
    cpuCost,
    blockSize,
    parallelizationCost,
    keyLength
  );

  return hash;
};
