import debug from 'debug';
import path from 'path';
import { asyncMap } from 'rxjs-async-map';
import { rxToStream, streamToStringRx } from 'rxjs-stream';
import { filter, map, mergeMap, scan, tap } from 'rxjs/operators';

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
  refs: string[];
};
export type Command =
  | CommandCapabilities
  | CommandOption
  | CommandList
  | CommandPush
  | CommandFetch;

type ApiBase = {
  list: (params: {
    refs: string[];
    dir: string;
    forPush: boolean;
  }) => Promise<string>;
  handlePush?: (params: { refs: PushRef[]; dir: string }) => Promise<string>;
  handleFetch?: (params: { refs: string[]; dir: string }) => Promise<string>;
};
type ApiPush = ApiBase & {
  handlePush: (params: { refs: PushRef[]; dir: string }) => Promise<string>;
  handleFetch?: undefined;
};
type ApiFetch = ApiBase & {
  handlePush?: undefined;
  handleFetch: (params: { refs: string[]; dir: string }) => Promise<string>;
};
type ApiBoth = ApiBase & {
  handlePush: (params: { refs: PushRef[]; dir: string }) => Promise<string>;
  handleFetch: (params: { refs: string[]; dir: string }) => Promise<string>;
};
type Api = ApiPush | ApiFetch | ApiBoth;

const GitRemoteHelper = ({
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
  const dir = path.join(process.cwd(), getDir());

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

  log('Startup #p6i3kB', { dir, capabilitiesResponse });

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
          return { command: GitCommands.fetch, refs: lines };
        } else if (command.startsWith(GitCommands.push)) {
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
          return api.list({ refs: [], dir, forPush });
        } catch (error) {
          console.error('api.list threw #R8aJlZ');
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
          return await api.handlePush({ refs, dir });
        } catch (error) {
          console.error('api.handlePush threw #R8aJlZ');
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
          return await api.handleFetch({ refs, dir });
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
