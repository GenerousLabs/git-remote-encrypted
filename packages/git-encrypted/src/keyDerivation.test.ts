import { deriveKey, deriveKeys } from './keyDerivation';
import { Keys } from './types';

describe('keyDerivation', () => {
  describe('deriveKey()', () => {
    it('Creates a hash from the password "foobar"', () => {
      return expect(
        deriveKey({
          password: 'foobar',
          salt: 'foosalt',
          cpuCost: 1024,
          blockSize: 8,
          parallelizationCost: 1,
          keyLength: 96
        })
      ).resolves.toMatchSnapshot();
    });

    it('Returns a hash with a length of 96 bytes', () => {
      return expect(
        deriveKey({
          password: 'quxbaz',
          salt: 'deadbeef',
          cpuCost: 1024,
          blockSize: 8,
          parallelizationCost: 1,
          keyLength: 96,
        })
      ).resolves.toHaveLength(96);
    });
  });

  describe('deriveKeys()', () => {
    it('Returns the same value as deriveKey(), split in three parts', () => {
      const password = 'foobar';
      const salt = 'foosalt';
      const cpuCost = 1024;
      const blockSize = 8;
      const parallelizationCost = 1;
      const keyLength = 96;

      const key1Promise: Promise<Uint8Array> = deriveKey({
        password,
        salt,
        cpuCost,
        blockSize,
        parallelizationCost,
        keyLength
      });
      const key2Promise: Promise<Keys> = deriveKeys({
        password,
        salt,
        cpuCost,
        blockSize,
        parallelizationCost
      });

      key2Promise.then(key2 => {
        const mergedArray = new Uint8Array(
          key2.content.length +
          key2.filename.length +
          key2.salt.length);

        mergedArray.set(key2.content);
        mergedArray.set(key2.filename, key2.content.length);
        mergedArray.set(key2.salt, key2.content.length + key2.filename.length);

        expect(key1Promise).resolves.toEqual(mergedArray);
      });
    });
  });
});
