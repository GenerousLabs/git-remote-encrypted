import fs from 'fs';

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
