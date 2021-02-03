import { superpathjoin as join } from 'superpathjoin';
import zod from 'zod';
import { ENCRYPTED_META_FILENAME } from './constants';
import { encryptedRepoCommit } from './git';
import { FS, GitBaseParamsEncrypted } from './types';
import { doesFileExist, generateKey } from './utils';

const DERIVATION_SALT_LENGTH = 32;
const DERIVATION_PARMS = {
  cpuCost: 1024,
  blockSize: 8,
  parallelizationCost: 1,
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
  const salt = generateKey(DERIVATION_SALT_LENGTH);
  return {
    version: 1,
    derivationParams: {
      ...DERIVATION_PARMS,
      salt: salt,
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
}): Promise<EncryptedMeta | undefined> => {
  const metaPath = getMetaPath({ encryptedDir });

  const doesMetaFileExist = await doesFileExist({ fs, path: metaPath });

  if (!doesMetaFileExist) {
    return;
  }

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
