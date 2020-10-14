import { join } from 'path';
import { ENCRYPTED_DIR } from './constants';
import { FS } from './types';

const NOT_FOUND_ERROR_CODE = 'ENOENT';

export const doesFileExist = async ({ fs, path }: { fs: FS; path: string }) => {
  return fs.promises.stat(path).then(
    stat => {
      return stat.isFile();
    },
    error => {
      if (error.code === NOT_FOUND_ERROR_CODE) {
        return false;
      }
      throw error;
    }
  );
};

/**
 * Wrap a git object. Prepend the object with the type, byte length, etc.
 */
export const wrap = ({
  type,
  object,
}: {
  type: string;
  object: Uint8Array | Buffer;
}) => {
  const buffer = Buffer.from(object);
  return Buffer.concat([
    Buffer.from(`${type} ${buffer.byteLength.toString()}\x00`),
    Buffer.from(buffer),
  ]);
};

export const unwrap = (input: Uint8Array | Buffer) => {
  const buffer = Buffer.from(input);
  const s = buffer.indexOf(32); // first space
  const i = buffer.indexOf(0); // first null value
  const type = buffer.slice(0, s).toString('utf8'); // get type of object
  const length = buffer.slice(s + 1, i).toString('utf8'); // get type of object
  const actualLength = buffer.length - (i + 1);
  // verify length
  if (parseInt(length) !== actualLength) {
    throw new Error(
      `Length mismatch #buosLJ: expected ${length} bytes but got ${actualLength} instead.`
    );
  }
  return {
    type,
    object: Buffer.from(buffer.slice(i + 1)),
  };
};

export const gitDirToEncryptedDir = ({ dir }: { dir: string }) => {
  return join(dir, ENCRYPTED_DIR);
};
