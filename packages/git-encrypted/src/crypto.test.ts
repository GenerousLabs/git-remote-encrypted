import { decodeBase64, decodeUTF8 } from 'tweetnacl-util';
import {
  concat,
  createNonce,
  decryptFile,
  encryptFile,
  encryptFilename,
  split,
  decryptFileContentsOnly,
} from './crypto';
import { KEYS } from './types';

const keys: KEYS = {
  content: decodeBase64('OTdY2G5jOtUb4NkTIrcMic5Om2FSGVNr+mOV21bMfkY='),
  filename: decodeBase64('aeFYzTwOrPbAPu7Lyw1QZ34JglphbLTgAAHtjr2Zcps='),
  salt: decodeBase64('wIfKspQFPMhcpxWSNO/d/aA50ErheC6t'),
};

const exampleFilename = '6fb50f57ebfe2687563a016a1cdce2f6ee445312';
const exampleFilenameArray = decodeUTF8(exampleFilename);
const exampleEncryptedFilename =
  'ffdc5e936be06e3facc5ef99c0f387b9ba3a65b27c23328021bbbd60805b56db447f6aeb3a34b2b27b81b154169047969fc79a0ec2686801';
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
    it('Encrypts to a known value #0IJkyE', async () => {
      const nonce = await createNonce({
        salt: keys.salt,
        input: exampleFilenameArray,
      });
      const encryptedFilename = await encryptFilename({
        filenameArray: exampleFilenameArray,
        nonce,
        keys,
      });
      expect(encryptedFilename).toEqual(exampleEncryptedFilename);
    });
  });

  describe('encryptFile() and decryptFile()', () => {
    it('Encrypts and decrypts #k279r6', async () => {
      const [name, body] = await encryptFile({
        filename: exampleFilename,
        contents: exampleArray,
        keys,
      });
      const [originalName, originalBody] = await decryptFile({
        fileContents: body,
        encryptedFilenameHex: name,
        keys,
      });

      expect(originalName).toEqual(exampleFilename);
      expect(originalBody).toEqual(exampleArray);
      expect(name).toEqual(exampleEncryptedFilename);
    });
  });

  describe('decryptFileContentsOnly()', () => {
    it('Decrypts a known value #T8Co26', async () => {
      const [, contents] = await encryptFile({
        filename: exampleFilename,
        contents: exampleArray,
        keys,
      });

      const decrypted = await decryptFileContentsOnly({
        fileContents: contents,
        keys,
      });

      expect(decrypted).toEqual(exampleArray);
    });
  });
});
