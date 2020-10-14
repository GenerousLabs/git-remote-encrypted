import debug from 'debug';
import path from 'path';
import { Subject } from 'rxjs';
import { asyncMap } from 'rxjs-async-map';
import { rxToStream, streamToStringRx } from 'rxjs-stream';
import { bufferWhen, filter, map, tap } from 'rxjs/operators';

const LOG_NAMESPACE = 'git-remote-helper';
const log = debug(LOG_NAMESPACE);
const logInput = debug([LOG_NAMESPACE, 'io', 'input'].join(':'));
const logOutput = debug([LOG_NAMESPACE, 'io', 'output'].join(':'));

export type PushRef = { src: string; dst: string; force: boolean };

type CommandCapabilities = {
  command: 'capabilities';
};
type CommandOption = {
  command: 'option';
  key: string;
  value: string;
};
type CommandList = {
  command: 'list';
  forPush: boolean;
};
type CommandPush = {
  command: 'push';
  refs: PushRef[];
};
type CommandFetch = {
  command: 'fetch';
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
  const trigger = new Subject<string>();
  const inputStream = streamToStringRx(stdin);

  inputStream.subscribe(line =>
    logInput('Got raw input line #soQ9FY', JSON.stringify(line))
  );

  const getDir = () => {
    if (typeof env['GIT_DIR'] !== 'string') {
      throw new Error('Missing GIT_DIR env #tVJpoU');
    }
    return env['GIT_DIR'];
  };
  const dir = path.join(process.cwd(), getDir());

  const capabilitiesResponse =
    ['option', 'push', 'fetch']
      .filter(option => {
        if (option === 'option') {
          return true;
        } else if (option === 'push') {
          return typeof api.handlePush === 'function';
        } else if (option === 'fetch') {
          return typeof api.handleFetch === 'function';
        } else {
          throw new Error('Unknown option #GDhBnb');
        }
      })
      .join(' ') + '\n\n';

  log('Startup #p6i3kB', { dir, capabilitiesResponse });

  const output = inputStream.pipe(
    tap(line => {
      trigger.next(line);
    }),
    map(x => x.trimEnd()),
    bufferWhen(() =>
      trigger.pipe(
        filter(triggerValue => {
          // log('Filtering trigger value #FVPZ6y', line);
          if (
            triggerValue === ''
            // triggerValue.startsWith('capabilities') ||
            // triggerValue.startsWith('option')
          ) {
            log('Emptying buffer #mwvjhm', JSON.stringify(triggerValue));
            return false;
          } else {
            log('Buffering this line #Pfi7Ss', JSON.stringify(triggerValue));
            return true;
          }
        }),
        tap(line => {
          log('trigger value #E7XHKm', JSON.stringify(line));
        })
      )
    ),
    tap(lines => {
      log('Buffer emptied #TRqQFc', JSON.stringify(lines));
    }),
    filter(lines => lines.length > 0),
    // Build objects from the sequential lines
    map(
      (lines): Command => {
        log('Mapping buffered line #pDqtRP', lines);

        const command = lines[0];

        if (command.startsWith('capabilities')) {
          return { command: 'capabilities' };
          // NOTE: This must come before the check for `list`
        } else if (command.startsWith('list for-push')) {
          return { command: 'list', forPush: true };
        } else if (command.startsWith('list')) {
          return { command: 'list', forPush: false };
        } else if (command.startsWith('option')) {
          const [, key, value] = command.split(' ');
          return { command: 'option', key, value };
        } else if (command.startsWith('fetch')) {
          const refs = lines.slice(1);
          return { command: 'fetch', refs };
        } else if (command.startsWith('push')) {
          const refs = lines.map(line => {
            // Strip the leading `push ` from the line
            const refsAndForce = line.slice(5);
            const force = refsAndForce[0] === '+';
            const refs = force ? refsAndForce.slice(1) : refsAndForce;
            const [src, dst] = refs.split(':');
            return { src, dst, force };
          });
          return { command: 'push', refs };
        }

        throw new Error('Unknown command #Py9QTP');
      }
    ),
    asyncMap(async command => {
      if (command.command === 'capabilities') {
        log('Returning capabilities #MJMFfj', command, capabilitiesResponse);
        return capabilitiesResponse;
      } else if (command.command === 'option') {
        // Disable all options for now
        log('Reporting option unsupported #WdUrzx', command);
        return 'unsupported\n';
      } else if (command.command === 'list') {
        const { forPush } = command;
        try {
          return api.list({ refs: [], dir, forPush });
        } catch (error) {
          console.error('api.list threw #R8aJlZ');
          console.error(error);
        }
      } else if (command.command === 'push') {
        const { refs } = command;
        if (typeof api.handlePush === 'undefined') {
          throw new Error('api.handlePush undefined #9eNmmz');
        }
        try {
          return api.handlePush({ refs, dir });
        } catch (error) {
          console.error('api.handlePush threw #R8aJlZ');
          console.error(error);
        }
      } else if (command.command === 'fetch') {
        const { refs } = command;
        if (typeof api.handleFetch === 'undefined') {
          throw new Error('api.handleFetch undefined #9eNmmz');
        }
        try {
          return api.handleFetch({ refs, dir });
        } catch (error) {
          console.error('api.handleFetch threw #5jxsQQ');
          console.error(error);
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
