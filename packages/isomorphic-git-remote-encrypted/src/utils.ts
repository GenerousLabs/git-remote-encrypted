const ENCRYPTED_PREFIX = 'encrypted::' as const;

export function getIsEncryptedRemoteUrl(url: string) {
  if (!url.startsWith(ENCRYPTED_PREFIX)) {
    return {
      url,
      isEncryptedRemote: false,
      encryptedRemoteUrl: undefined,
      keyDerivationPassword: undefined,
    };
  }

  const pieces = url.split('::');

  // Three parts means we have all 3 params
  if (pieces.length === 3) {
    return {
      url,
      isEncryptedRemote: true,
      encryptedRemoteUrl: pieces[2],
      // NOTE: This might be an empty string in some cases
      keyDerivationPassword: pieces[1].length > 0 ? pieces[1] : undefined,
    };
  }

  // Two parts means we have only a url and the `encrypted::` prefix
  if (pieces.length === 2) {
    return {
      url,
      isEncryptedRemote: true,
      encryptedRemoteUrl: pieces[1],
      keyDerivationPassword: undefined,
    };
  }

  throw new Error('Failed to parse encrypted remote URL #roIA4r');
}
