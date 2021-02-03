import { secretbox } from 'tweetnacl';

// This is copied from `require('tweetnacl-js').secretbox.keyLength`
export const KEY_LENGTH_BYTES = 32 as const;

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

export const ENCRYPTED_META_FILENAME = 'encrypted.json';
