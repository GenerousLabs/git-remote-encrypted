export { encryptedInit } from './api/encryptedInit';
export { encryptedPush, EncryptedPushResult } from './api/encryptedPush';
export { encryptedPull } from './api/encryptedPull';
export { getEncryptedRefObjectId } from './api/getRefObjectId';
export { getKeysFromDisk } from './api/getKeysFromDisk';
export { saveKeysToDisk } from './api/saveKeysToDisk';
export { getRefsGitString } from './api/getRefsGitString';

export * from './utils';
export * from './constants';
export * from './types';

import * as gitApi from './api/nodeGitApi';
export const nodeGitApi = gitApi;
