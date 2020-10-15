# git-encrypted

A base package that handles encryption to a git remote.

Exposes an API like so:

- `encryptedInit(keys)` - Create a new encrypted remote
- `encryptedClone(remoteUrl, keys)` - Clone an existing encrypted remote
- `encryptedPull(sourceRef, remoteUrl)` - Pull from an existing encrypted remote
- `encryptedPush(sourceRef, remoteUrl)` - Push to an existing encrypted remote
- `getRefs()` - Get refs from an existing encrypted remote
- `setRef()` - Set a new ref on an existing encrypted remote
- `deleteRef()` - Delete an existing ref on an existing encrypted remote
