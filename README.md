# git-remote-encrypted

This is a mono repo containing several packages which together create an
encrypted git remote strategy called `git-remote-encrypted`.

**WARNING**: This is very early stage code. It contains bugs, the encryption
\*setup is weak, do not use it for anything which requires high security.

## Usage

To experiment with this code, hopefully the following will get you up and
running, and if not, PRs / issues welcome.

- clone this repo
- install dependencies with `yarn`
- `yarn workspaces run build` to build all the code
- Now you need to link `packages/git-remote-encrypted/dist/cli/index.js` into
  your path, and it needs to be called `git-remote-encrypted`.
  - If you have a `~/bin` folder in your path you can do this  
    `ln -s packages/git-remote-encrypted/dist/cli/index.js ~/bin/git-remote-encrypted`
  - Otherwise, substitute `~/bin` for another directory alread in your PATH

To push to a new repository

- Create a new empty repository on your favourite host (GitHub is fine)
- Create a local repo
  - `mkdir testing-encrypted-git`
  - `cd testing-encrypted-git`
  - `git init .`
  - `git remote add enc encrypted::git@github.com:user/repo.git`
    - Or swap this for your any other git url prefixed with `encrypted::`
  - Add some files, commit
    - `echo testing > testing && git add testing && git commit -m 'it works!!'`
- Push as normal
  - `git push -u enc master`
- Now check the repo on GitHub
  - Behold encrypted content

NOTE: Your encryption keys have been saved in plain text inside `.git` at:
`testing-encrypted-git/.git/encrypted-keys/keys.json`

To clone from an existing repository

- Follow the steps above to have a remote which is already encrypted
- Create a local repo
  - `mkdir testing-decrypted-git`
  - `cd testing-decrypted-git`
  - `git init .`
  - `git remote add enc encrypted::git@github.com:user/repo.git`
    - Or swap this for your any other git url prefixed with `encrypted::`

* Restore your keys
  - `mkdir .git/encrypted-keys`
  - Copy the JSON into `.git/encrypted-keys/keys.json`

- Pull as normal
  - `git pull enc master`
  - `git branch -u enc/master`
- Behold decrypted content

NOTE: Your remote backup is useless without the keys. You are reponsible for
saving them somewhere.

NOTE: This software is extremely experimental, do not rely on it for anything
important.

Now try `git push` and `git pull` in both directories. Check the view on GitHub.

## Architecture

Inspired by [git-remote-gcrypt]() git-remote-encrypted builds a second,
encrypted, repository from the first, plain text, repository. We'll call
these two repositories `source` and `encrypted`. On `git push`, every [git
object](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) is
encrypted and then added to the `encrypted` repo. After all the objects have
been added, the `encrypted` repo is then pushed to the designated remote. On
`git pull` or `git fetch`, the `encrypted` repo is pulled, and then any new
objects are decrypted and copied into `source`.

The encryption is deterministic, so if the same git object is encrypted on
two machines, with the same encryption keys, it will produce the same
encrypted value.

The file layout is as follows:

- `source/`
- `source/.git`
- `source/.git/encrypted` - The `encrypted` repo
- `source/.git/encrypted-keys/` - The keys used to encrypt / decrypt

## Packages

This repo contains several packages:

- `git-remote-encrypted` - The git remote helper
- `isomorphic-git-remote-encrypted` - An extension to
  [isomorphic-git](https://isomorphic-git.org/) which adds support for
  encrypted remotes
- `git-encrypted` - The core encryption / decryption logic
- `git-remote-helper` - A generic helper to simplify creating git remote
  helpers

## Terminology

- `source` - The cleartext repository
- `encrypted` - The repository that contains the encrypted version of the
  objects from `source`
- `encryptedRemote` - The remote repository that `encrypted` is pulled from and
  pushed to

## Encryption Scheme

- Symmetric encryption
- One key to encrypt objects
- One key to encrypt filenames
- The object ID is combined with a salt and hashed to produce an encryption nonce
  - Unclear if this is safe or not. Perhaps a more elaborate password derivation scheme is required.
- The nonce and object key is used to encrypt the object body
- The same nonce is used to encrypt the filename
- The nonce and encrypted body are combined
  - This is saved into a file with the encrypted filename
