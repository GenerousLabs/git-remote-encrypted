import { secretbox } from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';
import { KEYS } from './types';

export const ENCRYPTED_DIR = 'encrypted' as const;
export const OBJECTS_DIR = 'objects';
export const REFS_DIR = 'refs';
export const ENCRYPTED_KEYS_DIR = 'encrypted-keys' as const;
export const KEYS_FILENAME = 'keys.json' as const;

export const ENCRYPTED_REMOTE_NAME = 'encryptedRemote';

export const REF_OID = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

export const { nonceLength: NONCE_LENGTH } = secretbox;

/**
 * The default branch name when creating the encrypted git repo
 */
export const DEFAULT_BRANCH_NAME = 'main';

export const GIT_ENCRYPTED_AUTHOR = {
  name: 'Encryption',
} as const;
export const GIT_ENCRYPTED_MESSAGE = 'Encrypted push' as const;

export const DEFAULT_KEYS: KEYS = {
  content: decodeBase64('OTdY2G5jOtUb4NkTIrcMic5Om2FSGVNr+mOV21bMfkY='),
  filename: decodeBase64('aeFYzTwOrPbAPu7Lyw1QZ34JglphbLTgAAHtjr2Zcps='),
  salt: decodeBase64('JbTmJEJIT3fx2agUFmLFkb0Zk60/Eeoa'),
};