# git-remote-helper

I wanted to create a
[git-remote-helper](https://git-scm.com/docs/gitremote-helpers) in
TypeScript. I figured I could copy something that already existed. I couldn't
find anything. There are some other helpers around, and some useful guides
which I used.

This package attempts to solve to problem I hoped somebody had solved before
me. It exposes an API that lets you write list, fetch, and pull functions and
it handles the git magic for you.

## Usage

```typescript
GitRemoteHelper({
  env: process.env,
  stdin: process.stdin,
  stdout: process.stdout,
  api: {
    /**
     * This will always be invoked when the remote helper is invoked
     */
    init: async (p: {
      gitdir: string;
      remoteName: string;
      remoteUrl: string;
    }) => {},
    /**
     * This needs to return a list of git refs.
     */
    list: async (p: {
      gitdir: string;
      remoteName: string;
      remoteUrl: string;
      forPush: boolean;
    }) => {},
    /**
     * This should put the requested objects into the `.git`
     */
    handleFetch: async (p: {
      gitdir: string;
      remoteName: string;
      remoteUrl: string;
      refs: { ref: string; oid: string }[];
    }) => {},
    /**
     * This should copy objects from `.git`
     */
    handlePush: async (p: {
      gitdir: string;
      remoteName: string;
      remoteUrl: string;
      refs: { ref: string; oid: string; force: boolean }[];
    }) => {},
  },
}).catch(error => {
  console.error(error);
});
```

Best to look at the code / types for more info.

The thing that it took me a long time to realise, was that I could interact
directly with the git repo via the usual git commands. The helper is told
what the user requested, and then it can access the repository directly to
pull objects, add new objects, and so on.
