# git-remote-encrypted

WARNING: This is an experimental library, consider it bug infested, insecure,
and downright DANGEROUS. If it eats your kitten, no warranty is expressed or
implied.

## Usage

### Git

```sh
npm --global install git-remote-encrypted
```

```sh
KEYS_PATH="~/.private/keys" git add remote encrypted::git@github.com/user/repo.git#main
```

Or pass the keys directly.

```sh
git add remote encrypted::git@github.com/user/repo.git#main::KEY1:KEY2:KEY3:KEY4
```

### JavaScript (or TypeScript)

```typescript
import git from 'git-remote-encrypted';
import fs from 'fs';

// Assuming this is an exisitng git repository
const dir = process.cwd();

git.encrypted.clone({ fs, dir, url, keys });
git.encrypted.pull({ fs, dir, remote: 'origin', keys });
git.encrypted.push({ fs, dir, remote: 'origin', keys });
```

If you try to push to an encrypted remote with isomorphic-git, it will fail,
as isomorphic-git doesn't know how to handle the `encrypted::` url.
