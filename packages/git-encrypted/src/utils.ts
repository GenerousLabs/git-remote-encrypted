import { join } from 'path';
import {
  ENCRYPTED_DIR,
  ENCRYPTED_KEYS_DIR,
  KEYS_FILENAME,
  OBJECTS_DIR,
  REFS_DIR,
} from './constants';
import { FS, GitBaseParams, RemoteUrl } from './types';

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

export const doesDirectoryExist = async ({
  fs,
  path,
}: {
  fs: FS;
  path: string;
}) => {
  return fs.promises.stat(path).then(
    stat => {
      return stat.isDirectory();
    },
    error => {
      if (error.code === NOT_FOUND_ERROR_CODE) {
        return false;
      }
      throw error;
    }
  );
};

export const ensureDirectoryExists = async ({
  fs,
  path,
}: {
  fs: FS;
  path: string;
}) => {
  if (!(await doesDirectoryExist({ fs, path }))) {
    await fs.promises.mkdir(path);
  }
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

export const getEncryptedDir = ({ gitdir }: Pick<GitBaseParams, 'gitdir'>) => {
  return join(gitdir, ENCRYPTED_DIR);
};

export const getEncryptedGitDir = ({
  gitdir,
}: Pick<GitBaseParams, 'gitdir'>) => {
  const encryptedDir = getEncryptedDir({ gitdir });
  return join(encryptedDir, '.git');
};

export const getEncryptedObjectsDir = ({
  gitdir,
}: Pick<GitBaseParams, 'gitdir'>) => {
  const encryptedDir = getEncryptedDir({ gitdir });
  return join(encryptedDir, OBJECTS_DIR);
};

export const getEncryptedRefsDir = ({
  gitdir,
}: Pick<GitBaseParams, 'gitdir'>) => {
  const encryptedDir = getEncryptedDir({ gitdir });
  return join(encryptedDir, REFS_DIR);
};

export const getEncryptedKeysDir = ({
  gitdir,
}: Pick<GitBaseParams, 'gitdir'>) => {
  return join(gitdir, ENCRYPTED_KEYS_DIR);
};

export const getKeysPath = ({ gitdir }: Pick<GitBaseParams, 'gitdir'>) => {
  const keysDir = getEncryptedKeysDir({ gitdir });
  return join(keysDir, KEYS_FILENAME);
};

export const parseGitRemoteUrl = ({ remoteUrl }: RemoteUrl) => {
  return { url: remoteUrl };
  // Disabling support for remote branches for now
  /*
  const [url, branch] = remoteUrl.split('#');
  if (
    typeof url !== 'string' ||
    url.length === 0 ||
    typeof branch !== 'string' ||
    branch.length === 0
  ) {
    throw new Error('Invalid encrypted remote URL #DfTbCY');
  }
  return { url, branch };
  */
};
