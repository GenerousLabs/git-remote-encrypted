export const parseRemoteUrl = ({ remoteUrl }: { remoteUrl: string }) => {
  const pieces = remoteUrl.split('::');
  if (pieces.length === 2) {
    return {
      encryptedRemoteUrl: pieces[1],
      keyDerivationPassword: pieces[0].length > 0 ? pieces[0] : undefined,
    };
  }

  return { encryptedRemoteUrl: pieces[0], keyDerivationPassword: undefined };
};
