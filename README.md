# git-remote-encrypted

This is a monorepo containing several packages which together create an
encrypted git remote strategy called `git-remote-encrypted`.

**WARNING**: This is very early stage code. It contains bugs, the encryption
setup is weak, do not use it for anything which requires high security.

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

- `git-remote-encrypted` - The git remote helper, this is probably where you
  want to start if you want to experiment with this code.
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
