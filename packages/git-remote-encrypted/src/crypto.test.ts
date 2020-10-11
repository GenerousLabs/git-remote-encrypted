import { decodeBase64, decodeUTF8 } from 'tweetnacl-util';
import { encryptFilename, concat, split, decrypt, encrypt } from './crypto';

const keys = {
  secret: decodeBase64('OTdY2G5jOtUb4NkTIrcMic5Om2FSGVNr+mOV21bMfkY='),
  secretNonce: decodeBase64('wIfKspQFPMhcpxWSNO/d/aA50ErheC6t'),
  filenames: decodeBase64('aeFYzTwOrPbAPu7Lyw1QZ34JglphbLTgAAHtjr2Zcps='),
  filenamesNonce: decodeBase64('JbTmJEJIT3fx2agUFmLFkb0Zk60/Eeoa'),
};

const exampleObjectId = '6fb50f57ebfe2687563a016a1cdce2f6ee445312';
const exampleEncryptedFilename =
  '4c0e2aafaf641002e186c1ca75d9d7610dae59cf4224aa89d0a375863af4b3fbeb486ad88d76edda3b7c797d425cb27295bc7a561ab0c0d2';
const exampleString = 'This is a simple text string';
const exampleArray = decodeUTF8(exampleString);

describe('crypto', () => {
  describe('cocnat()', () => {
    it('Successfully combines arrays #UFUHj5', () => {
      expect(
        concat(Uint8Array.from([255, 1, 0, 255]), Uint8Array.from([13]))
      ).toEqual(Uint8Array.from([255, 1, 0, 255, 13]));
    });
  });

  describe('split()', () => {
    it('Successfully splits an array #i2yH7q', () => {
      expect(
        split(
          Uint8Array.from([255, 1, 0, 255, 13]),

          4
        )
      ).toEqual([Uint8Array.from([255, 1, 0, 255]), Uint8Array.from([13])]);
    });
  });

  describe('encryptFilename()', () => {
    it('Encrypts to a known value #0IJkyE', () => {
      expect(encryptFilename(exampleObjectId, keys)).toEqual(
        exampleEncryptedFilename
      );
    });
  });

  describe('encrypt()', () => {
    it('Matches the snapshot #fbz3Op', () => {
      expect(encrypt(exampleObjectId, exampleArray, keys)).toMatchSnapshot();
    });
  });

  describe('encrypt() and decrypt()', () => {
    it('Correctly encrypts and decrypts back to the same #v3VSuD', () => {
      const [, encrypted] = encrypt(exampleObjectId, exampleArray, keys);
      const decrypted = decrypt(encrypted, keys);
      expect(decrypted).toEqual(exampleArray);
    });
  });
});
