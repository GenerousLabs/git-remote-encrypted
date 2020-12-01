import fs from 'fs';
import { HttpClient } from 'isomorphic-git';

export type Headers = {
  [name: string]: string;
};

// NOTE: These types are the same as in the `git-remote-helper` package, but not
// imported from there because we don't want to depend on the remote helper in
// the browser. Also, we don't strictly speaking need to keep the same API. The
// two APIs might diverge over time.
export type PushRef = { src: string; dst: string; force: boolean };
export type FetchRef = { ref: string; oid: string };

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

export type GitBaseHttpParams = {
  /**
   * The http client to pass to isomorphic-git. Can from one of these two:
   * import http from 'isomorphic-git/http/node';
   * import http from 'isomorphic-git/http/web';
   */
  http: HttpClient;
  /**
   * An optional corsProxy as defined by isomorphic-git
   */
  corsProxy?: string;
};

export type GitBaseOfflineParams = {
  /**
   * The filesystem instance for isomorphic-git. Can be node's fs, a LightningFS
   * instance, or otherwise. */
  fs: FS;
  /**
   * The full, absolute, path to the git directory (usually `repo/.git`).
   */
  gitdir: string;
};

export type GitBaseParams = GitBaseHttpParams & GitBaseOfflineParams;

export type GetKeys = () => Promise<KEYS>;

export type GitBaseParamsWithKeys = GitBaseParams & {
  /**
   * An async helper to return the keys. An example is exported which fetches
   * the keys from disk.
   */
  keys: KEYS;
};

export type GitApi = {
  clone: EncryptedPushPull;
  pull: EncryptedPushPull;
  push: EncryptedPushPull;
};

export type GitBaseParamsEncrypted = GitBaseParamsWithKeys & {
  gitApi: GitApi;
};

export type RemoteUrl = {
  /**
   * The remote URL provided from the native git client
   * eg: `git@host|https://#branchname`
   *
   * NOTE: This has the leading `encrypted::` part stripped
   */
  remoteUrl: string;
};

// export type EncryptedPushParams = RemoteUrl & Pick<GitBaseParamsEncrypted, 'encryptedDir'>;

export type EncryptedRemoteParams = {
  /**
   * The encrypted remote URL, as it should be passed to git. So already
   * stripped of all the `encrypted::` prefix and the `#main` branch suffix.
   */
  encryptedRemoteUrl: string;
  /**
   * The single branch on the `encryptedRemote` that we pull from / push to.
   */
  // Disable the remote branch for now, it's complicated
  // encryptedRemoteBranch: string;
  encryptedRemoteHeaders?: Headers;
};

export type EncryptedPushPull = (
  params: Omit<GitBaseParams, 'gitdir'> &
    EncryptedRemoteParams & {
      /**
       * The full path to the encrypted repo directory
       */
      encryptedDir: string;
      /**
       * Defaults to `true`, but if set to `false` the handler will silently *
       * swallow errors. This is helpful for some operations which are not
       * strictly necessary.
       */
      throwOnError?: boolean;
    }
) => Promise<void>;

export type KEYS = {
  content: Uint8Array;
  filename: Uint8Array;
  salt: Uint8Array;
};

export type KEYS_STRINGS = Record<keyof KEYS, string>;

type Ref = string;
type ObjectId = string;
export type RefPair = [Ref, ObjectId];
export type RefsMap = {
  [ref: string]: string;
};
