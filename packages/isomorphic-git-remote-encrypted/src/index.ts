import {
  encryptedFetch,
  encryptedInit,
  encryptedPush,
  FS,
  getEncryptedRefObjectId,
  getKeysFromDisk,
  GIT_ENCRYPTED_AUTHOR,
  Keys,
  KeysBase64,
  saveKeysToDisk,
} from 'git-encrypted';
import git, { HttpClient } from 'isomorphic-git';
import { superpathjoin as join } from 'superpathjoin';
import { gitApi } from './gitApi';
import { packageLog } from './packageLog';
export { gitApi } from './gitApi';

const ENCRYPTED_PREFIX = 'encrypted::' as const;

type PushOrPullParams = {
  fs: FS;
  http: HttpClient;
  /**
   * The repo working directory.
   *
   * NOTE: This directory must have a `.git` directory directly inside it, no
   * other configurations are currentlysupported.
   */
  dir: string;

  /**
   * The local ref that should be pushed, fully specified, like
   * `refs/heads/master`.
   */
  ref?: string;
  /**
   * The remote ref that should be updated, fully specified, like
   * `refs/heads/master`.
   */
  remoteRef?: string;
  /**
   * The name of the remote that should be pushed to, like `origin`.
   */
  remote?: string;
};

const pushLog = packageLog.extend('simplePush');
const pullLog = packageLog.extend('simplePull');
const cloneLog = packageLog.extend('simpleClone');

// If this function return `isEncryptedRemote` equal to `true`, then the
// `encryptedRemoteUrl` parameter must be a `string` and not `undefined`. We
// define the type definition of this function 3 times so that TypeScript
// understands this. The first (in this case generic) type seems to be the one
// used by TypeScript, even though multiple sources suggest it is the last
// version used. Unclear why, but with the generic type repeated as the first
// overload, TypeScript successfully understands the type definition.
export function getIsEncryptedRemoteUrl(
  url: string
): {
  url: string;
  isEncryptedRemote: boolean;
  encryptedRemoteUrl: string | undefined;
};
export function getIsEncryptedRemoteUrl(
  url: string
): {
  url: string;
  isEncryptedRemote: false;
  encryptedRemoteUrl: undefined;
};
export function getIsEncryptedRemoteUrl(
  url: string
): {
  url: string;
  isEncryptedRemote: true;
  encryptedRemoteUrl: string;
};
export function getIsEncryptedRemoteUrl(
  url: string
): {
  url: string;
  isEncryptedRemote: boolean;
  encryptedRemoteUrl: string | undefined;
} {
  const isEncryptedRemote = url.startsWith(ENCRYPTED_PREFIX);
  const encryptedRemoteUrl = isEncryptedRemote
    ? url.substr(ENCRYPTED_PREFIX.length)
    : undefined;

  return {
    url,
    isEncryptedRemote,
    encryptedRemoteUrl,
  };
}

export const getMaybeEncrtyptedRemoteUrl = async (
  params: Pick<PushOrPullParams, 'fs' | 'remote' | 'dir'>
) => {
  const { remote, ...base } = params;
  const remotes = await git.listRemotes(base);
  const remoteWithUrl = remotes.find(r => r.remote === remote);
  if (typeof remoteWithUrl === 'undefined') {
    throw new Error(`Remote ${remote} not found. #qgCrgi`);
  }

  return getIsEncryptedRemoteUrl(remoteWithUrl.url);
};

/**
 * Something akin to `git push remote ref:remoteRef` without any parameters.
 *
 * Currently you must supply the remote name,
 */
export const simplePushWithOptionalEncryption = async (params: {
  fs: FS;
  http: HttpClient;
  dir: string;
  /**
   * The local ref that should be pushed, fully specified, like
   * `refs/heads/master`.
   */
  ref?: string;
  /**
   * The remote ref that should be updated, fully specified, like
   * `refs/heads/master`.
   */
  remoteRef?: string;
  /**
   * The name of the remote that should be pushed to, like `origin`.
   */
  remote?: string;
}) => {
  const {
    fs,
    http,
    dir,
    ref = 'refs/heads/master',
    remoteRef = 'refs/heads/master',
    remote = 'origin',
  } = params;
  const gitdir = join(dir, '.git');

  pushLog('Invoked #uuUqDF', { dir, gitdir, ref, remoteRef, remote });

  const {
    isEncryptedRemote,
    encryptedRemoteUrl,
  } = await getMaybeEncrtyptedRemoteUrl({
    fs,
    dir,
    remote,
  });

  // If this is not an encrypted remote, then call the standard `git.push()`
  if (!isEncryptedRemote) {
    return git.push(params);
  }

  const keys = await getKeysFromDisk({ fs, gitdir });

  return encryptedPush({
    fs,
    http,
    gitApi,
    gitdir,
    keys,
    refs: [{ src: ref, dst: remoteRef, force: false }],
    remoteUrl: encryptedRemoteUrl,
  });
};

export const simplePullWithOptionalEncryption = async (
  params: PushOrPullParams
) => {
  const {
    fs,
    http,
    dir,
    ref = 'refs/heads/master',
    remoteRef = 'refs/heads/master',
    remote = 'origin',
  } = params;
  const gitdir = join(dir, '.git');

  pullLog('Invoked #aUnKFu', { dir, gitdir, ref, remoteRef, remote });

  const {
    isEncryptedRemote,
    encryptedRemoteUrl,
  } = await getMaybeEncrtyptedRemoteUrl({
    fs,
    dir,
    remote,
  });

  if (!isEncryptedRemote) {
    await git.push(params);
    return;
  }

  const keys = await getKeysFromDisk({ fs, gitdir });

  await encryptedFetch({
    fs,
    http,
    gitApi,
    gitdir,
    keys,
    remoteUrl: encryptedRemoteUrl,
  });

  const commitId = await getEncryptedRefObjectId({
    fs,
    http,
    gitdir,
    keys,
    ref: remoteRef,
  });

  if (typeof commitId === 'undefined') {
    throw new Error(
      'simplePullWithOptionalEncryption() failed to find remote ref #3SaIcw'
    );
  }

  await git.merge({
    fs,
    gitdir,
    theirs: commitId,
    fastForwardOnly: false,
    author: GIT_ENCRYPTED_AUTHOR,
  });

  await git.checkout({ fs, dir, ref });
};

/**
 * Something akin to `git clone`.
 *
 * NOTE: You must specify the remote and local refs. This will be improved in
 * the future, and they default to `refs/heads/master` for now.
 */
export const simpleEncryptedClone = async (
  params: Omit<PushOrPullParams, 'remote'> & {
    /**
     * The remote URL, prefixed with `encrypted::passphrase` if it is an
     * encrypted repo.
     */
    url: string;
  }
) => {
  const {
    fs,
    http,
    dir,
    url,
    ref = 'refs/heads/master',
    remoteRef = 'refs/heads/master',
  } = params;
  const gitdir = join(dir, '.git');

  cloneLog('Invoked #zdDigE', { dir, gitdir, url, ref, remoteRef });

  // TODO2 Add `keyDerivationPassword` extraction from URL here

  const { isEncryptedRemote, encryptedRemoteUrl } = getIsEncryptedRemoteUrl(
    url
  );

  if (!isEncryptedRemote) {
    throw new Error('Remote url without encrypted:: supplied #wWsiGr');
  }

  // Init a new repo at dir
  await git.init({ fs, dir });

  cloneLog('encryptedInit() #kRHgyD');
  await encryptedInit({
    fs,
    http,
    gitdir,
    encryptedRemoteUrl,
    // TODO2 Set this to the correct value
    keyDerivationPassword: '',
    gitApi,
  });

  cloneLog('git.addRemote() #FfHjvv');
  // Set the encrypted remote on the source repo
  await git.addRemote({ fs, gitdir, remote: 'origin', url, force: true });

  cloneLog('getKeysFromDisk() #2DX97q');
  const keys = await getKeysFromDisk({ fs, gitdir });

  cloneLog('encryptedFetch() #JcafjM');
  await encryptedFetch({ fs, http, gitdir, gitApi, remoteUrl: url, keys });
  cloneLog('getEncryptedRefObjectId() #7BiUlT');
  const headCommitObjectId = await getEncryptedRefObjectId({
    fs,
    http,
    gitdir,
    keys,
    ref,
  });
  if (typeof headCommitObjectId === 'undefined') {
    throw new Error('Failed to get HEAD commit from encrypted repo. #JgEf7I');
  }

  cloneLog('git.writeRef() #ViIfJo');
  await git.writeRef({
    fs,
    gitdir,
    ref: 'refs/heads/master',
    value: headCommitObjectId,
    force: true,
  });
  cloneLog('git.checkout() #7aMZpt');
  await git.checkout({ fs, dir });

  cloneLog('simplePullWithOptionalEncryption() #SO1xTQ');

  // TODO Get the HEAD encrypted ref then hand over to the simple pull
  await simplePullWithOptionalEncryption({
    fs,
    http,
    dir,
    remote: 'origin',
    ref,
    remoteRef,
  });
};
