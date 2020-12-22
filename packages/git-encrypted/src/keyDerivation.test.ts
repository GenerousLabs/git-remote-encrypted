import { hash } from './keyDerivation';

describe('keyDerivation', () => {
  describe('hash()', () => {
    it('Creates a hash from the password "foobar"', () => {
      return expect(hash('foobar')).resolves.toMatchSnapshot();
    });

    it('Returns a hash with a length of 96 bytes', () => {
      return expect(hash('quxbaz')).resolves.toHaveLength(96);
    });
  });
});