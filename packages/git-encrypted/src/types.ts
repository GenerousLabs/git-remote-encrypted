import fs from 'fs';
import { HttpClient } from 'isomorphic-git';

export type FS = {
  promises: {
    readFile: typeof fs.promises.readFile;
    writeFile: typeof fs.promises.writeFile;
    unlink: typeof fs.promises.unlink;
    readdir: typeof fs.promises.readdir;
    mkdir: typeof fs.promises.mkdir;
    rmdir: typeof fs.promises.rmdir;
    stat: typeof fs.promises.stat;
    lstat: typeof fs.promises.lstat;
    readlink?: typeof fs.promises.readlink;
    symlink?: typeof fs.promises.symlink;
    chmod?: typeof fs.promises.chmod;
  };
};

export type GitBaseParams = {
  /**
   * The filesystem instance for isomorphic-git. Can be node's fs, a LightningFS
   * instance, or otherwise. */
  fs: FS;
  /**
   * The full, absolute, path to the git directory (usually `repo/.git`).
   */
  gitDir: string;
  /**
   * The http client to pass to isomorphic-git. Can from one of these two:
   * import http from 'isomorphic-git/http/node';
   * import http from 'isomorphic-git/http/web';
   */
  http: HttpClient;
  corsProxy: string;
  gitPull: EncryptedPushPull;
  gitPush: EncryptedPushPull;
};

export type GetKeys = () => Promise<KEYS>;

export type GitBaseParamsEncrypted = GitBaseParams & {
  /**
   * An async helper to return the keys. An example is exported which fetches
   * the keys from disk.
   */
  getKeys: GetKeys;
};

export type RemoteUrl = {
  /**
   * The remote URL provided from the native git client
   * eg: `encrypted::git@host|https://#branchname`
   */
  remoteUrl: string;
};

// export type EncryptedPushParams = RemoteUrl & Pick<GitBaseParamsEncrypted, 'encryptedDir'>;

export type EncryptedPushPull = (
  params: Omit<GitBaseParams, 'gitDir' | 'gitPull' | 'gitPush'> & {
    /**
     * The full path to the encrypted repo directory
     */
    encryptedDir: string;
    /**
     * The encrypted remote URL, as it should be passed to git. So already
     * stripped of all the `encrypted::` prefix and the `#main` branch suffix.
     */
    encryptedRemoteUrl: string;
    /**
     * The single branch on the `encryptedRemote` that we pull from / push to.
     */
    encryptedRemoteBranch: string;
  }
) => Promise<void>;

export type KEYS = {
  content: Uint8Array;
  filename: Uint8Array;
  salt: Uint8Array;
};

export type KEYS_STRINGS = Record<keyof KEYS, string>;
