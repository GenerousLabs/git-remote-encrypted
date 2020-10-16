export const clone = async () => {
  await git.clone({
    ...base,
    dir: encryptedDir,
    url: encryptedRemoteUrl,
    remote: ENCRYPTED_REMOTE_NAME,
    // ref: encryptedRemoteBranch,
    singleBranch: true,
    noTags: true,
  });
};
