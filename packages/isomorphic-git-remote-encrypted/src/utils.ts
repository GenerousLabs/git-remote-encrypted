const ENCRYPTED_PREFIX = 'encrypted::' as const;

// If this function return `isEncryptedRemote` equal to `true`, then the
// `encryptedRemoteUrl` parameter must be a `string` and not `undefined`. We
// define the type definition of this function 3 times so that TypeScript
// understands this. The first (in this case generic) type seems to be the one
// used by TypeScript, even though multiple sources suggest it is the last
// version used. Unclear why, but with the generic type repeated as the first
// overload, TypeScript successfully understands the type definition.

// TODO: this does not work as intended: encryptedRemoteUrl should be of type
// "string" if isEncryptedUrl is "true", but it is of type "string | undefined"
// export function getIsEncryptedRemoteUrl(
//   url: string
// ): {
//   url: string;
//   isEncryptedRemote: boolean;
//   encryptedRemoteUrl: string | undefined;
//   keyDerivationPassword: string | undefined;
// };
// export function getIsEncryptedRemoteUrl(
//   url: string
// ): {
//   url: string;
//   isEncryptedRemote: false;
//   encryptedRemoteUrl: undefined;
//   keyDerivationPassword: undefined;
// };
// export function getIsEncryptedRemoteUrl(
//   url: string
// ): {
//   url: string;
//   isEncryptedRemote: true;
//   encryptedRemoteUrl: string;
//   keyDerivationPassword: string | undefined;
// };
export function getIsEncryptedRemoteUrl(
  url: string
  // ): {
  //   url: string;
  //   isEncryptedRemote: boolean;
  //   encryptedRemoteUrl: string | undefined;
  //   keyDerivationPassword: string | undefined;
  // } {
) {
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
