import { describe, it, expect } from '@jest/globals';
import { parseRemoteUrl } from './utils';

describe('utils', () => {
  describe('parseRemoteUrl()', () => {
    it('Parses url #RcUhqe', () => {
      expect(
        parseRemoteUrl({ remoteUrl: 'git@host.tld:user/repo.git' })
      ).toEqual({
        encryptedRemoteUrl: 'git@host.tld:user/repo.git',
        keyDerivationPassword: undefined,
      });
    });

    it('Parses empty password #9RmAxZ', () => {
      expect(
        parseRemoteUrl({ remoteUrl: '::git@host.tld:user/repo.git' })
      ).toEqual({
        encryptedRemoteUrl: 'git@host.tld:user/repo.git',
        keyDerivationPassword: undefined,
      });
    });

    it('Parses password and url #WkoH2y', () => {
      expect(
        parseRemoteUrl({ remoteUrl: 'pass::git@host.tld:user/repo.git' })
      ).toEqual({
        encryptedRemoteUrl: 'git@host.tld:user/repo.git',
        keyDerivationPassword: 'pass',
      });
    });
  });
});
