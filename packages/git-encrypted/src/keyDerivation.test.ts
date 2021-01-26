import { hash } from './keyDerivation';

describe('keyDerivation', () => {
  describe('hash()', () => {
    it('Creates a hash from the password "foobar"', () => {
      return expect(
        hash({
          password: 'foobar',
          salt: 'foosalt',
          cpuCost: 1024,
          blockSize: 8,
          parallelizationCost: 1,
        })
      ).resolves.toMatchSnapshot();
    });

    it('Returns a hash with a length of 96 bytes', () => {
      return expect(
        hash({
          password: 'quxbaz',
          salt: 'deadbeef',
          cpuCost: 1024,
          blockSize: 8,
          parallelizationCost: 1,
        })
      ).resolves.toHaveLength(96);
    });
  });
});
