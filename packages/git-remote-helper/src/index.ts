import debug from 'debug';
import { asyncMap } from 'rxjs-async-map';
import { rxToStream, streamToStringRx } from 'rxjs-stream';
import { filter, map, mergeMap, scan, tap } from 'rxjs/operators';
import { superpathjoin } from 'superpathjoin';

// TODO Add tests

enum GitCommands {
  capabilities = 'capabilities',
  option = 'option',
  list = 'list',
  push = 'push',
  fetch = 'fetch',
}
const ONE_LINE_COMMANDS = [
  GitCommands.capabilities,
  GitCommands.option,
  GitCommands.list,
];

const logError = (...args: any) => {
  console.error(...args);
};
const log = debug('git-remote-helper');
const logIo = log.extend('io');
const logInput = logIo.extend('input');
const logOutput = logIo.extend('output');

export type PushRef = { src: string; dst: string; force: boolean };
export type FetchRef = { ref: string; oid: string };

type CommandCapabilities = {
  command: GitCommands.capabilities;
};
type CommandOption = {
  command: GitCommands.option;
  key: string;
  value: string;
};
type CommandList = {
  command: GitCommands.list;
  forPush: boolean;
};
type CommandPush = {
  command: GitCommands.push;
  refs: PushRef[];
};
type CommandFetch = {
  command: GitCommands.fetch;
  refs: FetchRef[];
};
export type Command =
  | CommandCapabilities
  | CommandOption
  | CommandList
  | CommandPush
  | CommandFetch;

/**
 * These are parameters which are passed to every api callback
 */
type ApiBaseParams = {
  gitdir: string;
  /**
   * The remote name, or the remote URL if a name is not provided. Supplied by
   * the native git client.
   */
  remoteName: string;
  /**
   * The remote URL passed by the native git client.
   *
   * NOTE: It will not contain the leading `HELPER::`, only the part after that.
   */
  remoteUrl: string;
};

type HandlePush = (
  params: ApiBaseParams & { refs: PushRef[] }
) => Promise<string>;
type HandleFetch = (
  params: ApiBaseParams & {
    refs: FetchRef[];
  }
) => Promise<string>;

type ApiBase = {
  /**
   * Optional init() hook which will be called each time that the
   * git-remote-helper is invoked before any other APIs are called. It will be
   * awaited, so you can safely do setup steps here and trust they will be
   * finished before any of the other API methods are invoked.
   */
  init?: (params: ApiBaseParams) => Promise<void>;
  list: (
    params: ApiBaseParams & {
      forPush: boolean;
    }
  ) => Promise<string>;
  handlePush?: HandlePush;
  handleFetch?: HandleFetch;
};
type ApiPush = ApiBase & {
  handlePush: HandlePush;
  handleFetch?: undefined;
};
type ApiFetch = ApiBase & {
  handlePush?: undefined;
  handleFetch: HandleFetch;
};
type ApiBoth = ApiBase & {
  handlePush: HandlePush;
  handleFetch: HandleFetch;
};
type Api = ApiPush | ApiFetch | ApiBoth;

const GitRemoteHelper = async ({
  env,
  api,
  stdin,
  stdout,
}: {
  env: typeof process.env;
  stdin: typeof process.stdin;
  stdout: typeof process.stdout;
  api: Api;
}) => {
  const inputStream = streamToStringRx(stdin);

  const getDir = () => {
    if (typeof env['GIT_DIR'] !== 'string') {
      throw new Error('Missing GIT_DIR env #tVJpoU');
    }
    return env['GIT_DIR'];
  };
  const gitdir = superpathjoin(process.cwd(), getDir());

  const [, , remoteName, remoteUrl] = process.argv;

  const capabilitiesResponse =
    [GitCommands.option, GitCommands.push, GitCommands.fetch]
      .filter(option => {
        if (option === GitCommands.option) {
          return true;
        } else if (option === GitCommands.push) {
          return typeof api.handlePush === 'function';
        } else if (option === GitCommands.fetch) {
          return typeof api.handleFetch === 'function';
        } else {
          throw new Error('Unknown option #GDhBnb');
        }
      })
      .join('\n') + '\n\n';

  log('Startup #p6i3kB', {
    gitdir,
    remoteName,
    remoteUrl,
    capabilitiesResponse,
  });

  if (typeof api.init === 'function') {
    await api.init({ gitdir, remoteName, remoteUrl });
  }

  const commands = inputStream.pipe(
    tap(line => {
      logInput('Got raw input line #gARMUQ', JSON.stringify(line));
    }),
    // The `line` can actually contain multiple lines, so we split them out into
    // multiple pieces and recombine them again
    map(line => line.split('\n')),
    mergeMap(lineGroup => lineGroup),
    // Commands include a trailing newline which we don't need
    map(line => line.trimEnd()),
    scan(
      (acc, line) => {
        log('Scanning #NH7FyX', JSON.stringify({ acc, line }));
        // If we emitted the last value, then we ignore all of the current lines
        // and start fresh on the next "batch"
        const linesWaitingToBeEmitted = acc.emit ? [] : acc.lines;

        // When we hit an empty line, it's always the completion of a command
        // block, so we always want to emit the lines we've been collecting.
        // NOTE: We do not add the blank line onto the existing array of lines
        // here, it gets dropped here.
        if (line === '') {
          if (linesWaitingToBeEmitted.length === 0) {
            return { emit: false, lines: [] };
          }

          return { emit: true, lines: linesWaitingToBeEmitted };
        }

        // Some commands emit one line at a time and so do not get buffered
        if (ONE_LINE_COMMANDS.find(command => line.startsWith(command))) {
          // If we have other lines waiting for emission, something went wrong
          if (linesWaitingToBeEmitted.length > 0) {
            logError(
              'Got one line command with lines waiting #ompfQK',
              JSON.stringify({ linesWaitingToBeEmitted })
            );
            throw new Error('Got one line command with lines waiting #evVyYv');
          }

          return { emit: true, lines: [line] };
        }

        // Otherwise, this line is part of a multi line command, so stick it
        // into the "buffer" and do not emit
        return { emit: false, lines: linesWaitingToBeEmitted.concat(line) };
      },
      { emit: false, lines: [] as string[] }
    ),
    tap(acc => {
      log('Scan output #SAAmZ4', acc);
    }),
    filter(acc => acc.emit),
    map(emitted => emitted.lines),
    tap(lines => {
      log('Buffer emptied #TRqQFc', JSON.stringify(lines));
    })
  );

  // NOTE: Splitting this into 2 pipelines so typescript is happy that it
  // produces a string
  const output = commands.pipe(
    // filter(lines => lines.length > 0),
    // Build objects from the sequential lines
    map(
      (lines): Command => {
        log('Mapping buffered line #pDqtRP', lines);

        const command = lines[0];

        if (command.startsWith('capabilities')) {
          return { command: GitCommands.capabilities };
        } else if (command.startsWith(GitCommands.list)) {
          return {
            command: GitCommands.list,
            forPush: command.startsWith('list for-push'),
          };
        } else if (command.startsWith(GitCommands.option)) {
          const [, key, value] = command.split(' ');
          return { command: GitCommands.option, key, value };
        } else if (command.startsWith(GitCommands.fetch)) {
          // Lines for fetch commands look like:
          // fetch sha1 branchName
          const refs = lines.map(line => {
            const [, oid, ref] = line.split(' ');
            return { oid, ref };
          });

          return { command: GitCommands.fetch, refs };
        } else if (command.startsWith(GitCommands.push)) {
          // Lines for push commands look like this (the + means force push):
          // push refs/heads/master:refs/heads/master
          // push +refs/heads/master:refs/heads/master
          const refs = lines.map(line => {
            // Strip the leading `push ` from the line
            const refsAndForce = line.slice(5);
            const force = refsAndForce[0] === '+';
            const refs = force ? refsAndForce.slice(1) : refsAndForce;
            const [src, dst] = refs.split(':');
            return { src, dst, force };
          });

          return { command: GitCommands.push, refs };
        }

        throw new Error('Unknown command #Py9QTP');
      }
    ),
    asyncMap(async command => {
      if (command.command === GitCommands.capabilities) {
        log(
          'Returning capabilities #MJMFfj',
          JSON.stringify({ command, capabilitiesResponse })
        );
        return capabilitiesResponse;
      } else if (command.command === GitCommands.option) {
        // TODO Figure out how to handle options properly
        log(
          'Reporting option unsupported #WdUrzx',
          JSON.stringify({ command })
        );
        return 'unsupported\n';
      } else if (command.command === GitCommands.list) {
        const { forPush } = command;
        try {
          return api.list({ gitdir, remoteName, remoteUrl, forPush });
        } catch (error) {
          console.error('api.list threw #93ROre');
          // console.error(error);
          throw error;
        }
      } else if (command.command === GitCommands.push) {
        log('Calling api.handlePush() #qpi4Ah');
        const { refs } = command;
        if (typeof api.handlePush === 'undefined') {
          throw new Error('api.handlePush undefined #9eNmmz');
        }
        try {
          // NOTE: Without the await here, the promise is returned immediately,
          // and the catch block never fires.
          return await api.handlePush({ refs, gitdir, remoteName, remoteUrl });
        } catch (error) {
          console.error('api.handlePush threw #9Ei4c4');
          // console.error(error);
          throw error;
        }
      } else if (command.command === GitCommands.fetch) {
        const { refs } = command;
        if (typeof api.handleFetch === 'undefined') {
          throw new Error('api.handleFetch undefined #9eNmmz');
        }
        try {
          // NOTE: Without the await here, the promise is returned immediately,
          // and the catch block never fires.
          return await api.handleFetch({ refs, gitdir, remoteName, remoteUrl });
        } catch (error) {
          console.error('api.handleFetch threw #5jxsQQ');
          // console.error(error);
          throw error;
        }
      }

      throw new Error('Unrecognised command #e6nTnS');
    }, 1),
    tap(x => {
      logOutput('Sending response #31EyIs', JSON.stringify(x));
    })
  );

  rxToStream(output).pipe(stdout);
};

export default GitRemoteHelper;
