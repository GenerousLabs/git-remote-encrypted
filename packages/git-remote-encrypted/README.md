# git-remote-encrypted

WARNING: This is an experimental library, consider it bug infested, insecure,
and downright DANGEROUS. If it eats your kitten, no warranty is expressed or
implied.

## Usage

Firstly, install the package:

```sh
npm -g install git-remote-encrypted
```

### Experiment

Then, to experiment with this proof-of-concept, you can first push to an
encrypted repository, and then pull from it into another location.

To **push** to a new repository:

- Create a new empty repository on your favourite host (GitHub is fine)
- Create a local repo
  - `mkdir testing-encrypted-git`
  - `cd testing-encrypted-git`
  - `git init .`
  - `git remote add enc encrypted::git@github.com:user/repo.git`
    - Or swap this for your any other git url prefixed with `encrypted::`
    - **NOTE:** Relative paths are not currently supported. See [#3](https://github.com/GenerousLabs/git-remote-encrypted/issues/3)
  - Add some files, commit
    - `echo testing > testing && git add testing && git commit -m 'it works!!'`
- Push as normal
  - `git push -u enc master`
- Now check the repo on GitHub
  - Behold encrypted content

NOTE: Your encryption keys have been saved in plain text inside `.git` at:
`testing-encrypted-git/.git/encrypted-keys/keys.json`. They're in plain text,
this is a proof-of-concept.

Then to **pull** from your encrypted repository:

- Create a new local repo
  - `mkdir testing-decrypted-git`
  - `cd testing-decrypted-git`
  - `git init .`
  - `git remote add enc encrypted::git@github.com:user/repo.git`
    - Or swap this for your any other git url prefixed with `encrypted::`

* Restore your keys
  - `mkdir .git/encrypted-keys`
  - Copy the JSON keys into `.git/encrypted-keys/keys.json`

- Pull as normal
  - `git pull enc master`
  - `git branch -u enc/master`
- Behold decrypted content

## Notes

- Your remote backup is useless without the keys. You are reponsible for
  saving them somewhere.
- This software is extremely experimental, do not rely on it for anything
  important. There are probably gaping holes in the crypto. Issues or PRs
  welcome.

## Development

To develop this locally, you can do the following:

- `yarn workspaces run build`
- `ln -s ~/bin/git-remote-encrypted $(pwd)/cli/index.js`
  - Or equivalent. Essentially you need a symlink in your PATH that is called
    `git-remote-encrypted` and that targets the `cli/index.js` file in this
    folder.
- You need to rerun the build command after each change, or run the
  appropriate watch command for both this package and the dependent
  `git-remote-helper` and `git-encrypted` packages.
