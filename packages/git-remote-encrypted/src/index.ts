import isomorphicGit from 'isomorphic-git';

const api = Object.assign({}, isomorphicGit, {
  encrypted: {
    clone: async () => {},
    pull: async () => {},
    push: async () => {},
  },
});

export default api;
