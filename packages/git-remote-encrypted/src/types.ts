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
  dir: string;
  /**
   * The http client to pass to isomorphic-git. Can from one of these two:
   * import http from 'isomorphic-git/http/node';
   * import http from 'isomorphic-git/http/web';
   */
  http: HttpClient;
};
