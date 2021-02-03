import { describe, it, expect } from '@jest/globals';
import { getIsEncryptedRemoteUrl } from './utils';

describe('utils', () => {
  describe('getIsEncryptedRemoteUrl()', () => {
    it('Parses encrypted::url #djeDkU', () => {
      expect(
        getIsEncryptedRemoteUrl('encrypted::git@host.tld:user/repo.git')
      ).toEqual({
        url: 'encrypted::git@host.tld:user/repo.git',
        isEncryptedRemote: true,
        encryptedRemoteUrl: 'git@host.tld:user/repo.git',
        keyDerivationPassword: undefined,
      });
    });

    it('Parses encrypted::pass::url #pmv95c', () => {
      expect(
        getIsEncryptedRemoteUrl('encrypted::pass::git@host.tld:user/repo.git')
      ).toEqual({
        url: 'encrypted::pass::git@host.tld:user/repo.git',
        isEncryptedRemote: true,
        encryptedRemoteUrl: 'git@host.tld:user/repo.git',
        keyDerivationPassword: 'pass',
      });
    });

    it('Parses encrypted::::url #GndXud', () => {
      expect(
        getIsEncryptedRemoteUrl('encrypted::::git@host.tld:user/repo.git')
      ).toEqual({
        url: 'encrypted::::git@host.tld:user/repo.git',
        isEncryptedRemote: true,
        encryptedRemoteUrl: 'git@host.tld:user/repo.git',
        keyDerivationPassword: undefined,
      });
    });
  });
});
