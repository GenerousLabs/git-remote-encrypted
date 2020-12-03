import Bluebird from 'bluebird';
import git from 'isomorphic-git';
import { deflate, inflate } from 'pako';
import { superpathjoin as join } from 'superpathjoin';
import { decodeUTF8 } from 'tweetnacl-util';
import {
  createNonce,
  decryptFileContentsOnly,
  encryptFile,
  encryptFilename,
} from './crypto';
import { GitBaseOfflineParams, GitBaseParams, KEYS } from './types';
import { getEncryptedObjectsDir, getEncryptedRefsDir, wrap } from './utils';

// This is unnecessarily async because the isomorphic-git inflate / deflate code
// can be async in the browser, so we mirror that here in the hope of
// maintaining better compatibility if we can get access to isomorphic-git's
// internal APIs instead of building our own.
export const wrapAndDeflate = async ({
  objectType,
  content,
}: {
  objectType: string;
  content: Uint8Array;
}) => {
  return deflate(wrap({ type: objectType, object: content }));
};

enum FileType {
  object = 'object',
  ref = 'ref',
}

const assertNever = (_v: never): never => {
  throw new Error('Assert never #4mgmWA');
};

export const getEncryptedFileDir = ({
  gitdir,
  fileType,
}: {
  gitdir: string;
  fileType: FileType;
}) => {
  switch (fileType) {
    case FileType.object: {
      return getEncryptedObjectsDir({ gitdir });
    }
    case FileType.ref: {
      return getEncryptedRefsDir({ gitdir });
    }
    default: {
      return assertNever(fileType);
    }
  }
};

export const writeEncryptedFile = async ({
  fs,
  gitdir,
  fileType,
  encryptedFilename,
  encryptedContent,
}: Pick<GitBaseParams, 'fs' | 'gitdir'> & {
  fileType: FileType;
  encryptedFilename: string;
  encryptedContent: Uint8Array;
}) => {
  const dir = getEncryptedFileDir({ gitdir, fileType });
  const path = join(dir, encryptedFilename);

  await fs.promises.writeFile(path, encryptedContent);
};

export const encryptAndWriteObject = async ({
  fs,
  deflatedWrappedContent,
  gitdir,
  objectId,
  keys,
}: Pick<GitBaseParams, 'fs' | 'gitdir'> & {
  keys: KEYS;
  objectId: string;
  deflatedWrappedContent: Uint8Array;
}) => {
  const [encryptedFilename, encryptedContent] = await encryptFile({
    filename: objectId,
    contents: deflatedWrappedContent,
    keys,
  });
  await writeEncryptedFile({
    fs,
    gitdir,
    fileType: FileType.object,
    encryptedFilename,
    encryptedContent,
  });
};

export const copySourceObjectToEncryptedRepo = async (
  params: GitBaseParams & { keys: KEYS; objectId: string }
) => {
  const { objectId, ...base } = params;

  const obj = await git.readObject({
    ...params,
    oid: objectId,
    format: 'deflated',
  });

  if (obj.format === 'content') {
    const deflatedWrappedContent = await wrapAndDeflate({
      objectType: obj.type,
      content: obj.object,
    });
    return encryptAndWriteObject({
      ...base,
      deflatedWrappedContent,
      objectId,
    });
  }

  if (obj.format !== 'deflated') {
    console.error('Result neither deflated nor content #HOqcrW', obj);
    throw new Error('Result not deflated and not content #zNagK7');
  }

  return encryptAndWriteObject({
    ...base,
    deflatedWrappedContent: obj.object,
    objectId,
  });
};

export const readEnryptedObject = async (
  params: GitBaseOfflineParams & { keys: KEYS; objectId: string }
) => {
  const { fs, gitdir, objectId, keys } = params;
  const dir = getEncryptedFileDir({ gitdir, fileType: FileType.object });
  const objectIdArray = decodeUTF8(objectId);

  const nonce = await createNonce({ salt: keys.salt, input: objectIdArray });
  const filename = await encryptFilename({
    filenameArray: objectIdArray,
    nonce,
    keys,
  });

  const path = join(dir, filename);

  const fileContents = await fs.promises.readFile(path);

  const deflatedWrappedObject = await decryptFileContentsOnly({
    fileContents,
    keys,
  });

  return deflatedWrappedObject;
};

export const writeDeflatedWrappdObjectToSourceRepo = async ({
  deflatedWrappedObject,
  fs,
  gitdir,
}: Omit<GitBaseParams, 'http' | 'corsProxy'> & {
  deflatedWrappedObject: Uint8Array;
}) => {
  const inflated = inflate(deflatedWrappedObject);

  await git.writeObject({
    fs,
    gitdir,
    object: inflated,
    format: 'wrapped',
  });
};

export const copyEncryptedObjectToSourceRepo = async (
  params: GitBaseOfflineParams & { keys: KEYS; objectId: string }
) => {
  const { fs, gitdir } = params;
  const deflatedWrappedObject = await readEnryptedObject(params);

  await writeDeflatedWrappdObjectToSourceRepo({
    fs,
    gitdir,
    deflatedWrappedObject,
  });
};

export const copyAllEncryptedObjectsToSourceRepo = async ({
  fs,
  gitdir,
  keys,
}: GitBaseOfflineParams & { keys: KEYS }) => {
  const encryptedObjectsDir = getEncryptedObjectsDir({ gitdir });

  const encryptedObjectFilenames = await fs.promises.readdir(
    encryptedObjectsDir
  );

  await Bluebird.each(encryptedObjectFilenames, async filename => {
    const path = join(encryptedObjectsDir, filename);
    const fileContents = await fs.promises.readFile(path);
    const deflatedWrappedObject = await decryptFileContentsOnly({
      fileContents,
      keys,
    });
    await writeDeflatedWrappdObjectToSourceRepo({
      fs,
      gitdir,
      deflatedWrappedObject,
    });
  });
};
