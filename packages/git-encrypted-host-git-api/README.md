# git-encrypted-host-git-api

If you're using the git-encrypted package in an environment where git is
installed, then this package provides an API that calls `git pull`, `git fetch`, `git clone` etc on the host system.

This is primarily used for git ssh urls like `git@host.tld:user/repo.git`
which isomorphic-git is unable to handle.
