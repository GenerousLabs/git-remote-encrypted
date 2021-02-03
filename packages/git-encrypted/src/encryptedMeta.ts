import { superpathjoin as join } from 'superpathjoin';
import zod from 'zod';
import { encryptedRepoCommit } from './git';
import { FS, GitBaseParamsEncrypted } from './types';
import { generateKey } from './utils';

const ENCRYPTED_META_FILENAME = 'encrypted.json';
const CREATE_ENCRYPTED_META_PARAMS = {
  saltLength: 1024,
  cpuCost: 1024,
  blockSize: 8,
  parallelizationCost: 1
};

const EncryptedMetaSchema = zod.object({
  version: zod.literal(1),
  derivationParams: zod.object({
    salt: zod.string().nonempty(),
    cpuCost: zod
      .number()
      .int()
      .positive(),
    blockSize: zod
      .number()
      .int()
      .positive(),
    parallelizationCost: zod
      .number()
      .int()
      .positive(),
  }),
});
type EncryptedMeta = zod.infer<typeof EncryptedMetaSchema>;

const createEncryptedMeta = (): EncryptedMeta => {
  const salt = generateKey(CREATE_ENCRYPTED_META_PARAMS.saltLength);
  return {
    version: 1,
    derivationParams: {
      salt: salt,
      cpuCost: CREATE_ENCRYPTED_META_PARAMS.cpuCost,
      blockSize: CREATE_ENCRYPTED_META_PARAMS.blockSize,
      parallelizationCost: CREATE_ENCRYPTED_META_PARAMS.parallelizationCost,
    },
  };
};

const getMetaPath = ({ encryptedDir }: { encryptedDir: string }) => {
  return join(encryptedDir, ENCRYPTED_META_FILENAME);
};

const readMetaFromDisk = async ({
  fs,
  encryptedDir,
}: {
  fs: FS;
  encryptedDir: string;
}): Promise<EncryptedMeta> => {
  const metaPath = getMetaPath({ encryptedDir });
  const metaJson = await fs.promises.readFile(metaPath, 'utf8');
  const meta = JSON.parse(metaJson);
  EncryptedMetaSchema.parse(meta);

  return meta;
};

const writeMetaToEncryptedRepo = async ({
  fs,
  encryptedDir,
  meta,
}: {
  fs: FS;
  encryptedDir: string;
  meta: EncryptedMeta;
}) => {
  const metaPath = getMetaPath({ encryptedDir });

  EncryptedMetaSchema.parse(meta);
  const metaJson = JSON.stringify(meta);

  await fs.promises.writeFile(metaPath, metaJson, { encoding: 'utf8' });
  await encryptedRepoCommit({ fs, gitdir: encryptedDir });
};

export const ensureMetaExists = async ({
  fs,
  encryptedDir,
}: Pick<GitBaseParamsEncrypted, 'fs'> & {
  encryptedDir: string;
}): Promise<EncryptedMeta> => {
  const meta = await readMetaFromDisk({ fs, encryptedDir });
  if (typeof meta !== 'undefined') {
    return meta;
  }

  const metaToSave = createEncryptedMeta();
  await writeMetaToEncryptedRepo({ fs, encryptedDir, meta: metaToSave });
  return metaToSave;
};
