import zod from 'zod';
import { superpathjoin as join } from 'superpathjoin';

import { FS, GitBaseParamsEncrypted } from './types';
import { generateKey } from './crypto';
import { encryptedRepoCommit } from './git';

const META_FILENAME = 'encrypted.json';

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
  return {
    version: 1,
    derivationParams: {
      salt: generateKey(1024),
      cpuCost: 1024,
      blockSize: 8,
      parallelizationCost: 1,
    },
  };
};

const getMetaPath = ({ encryptedDir }: { encryptedDir: string }) => {
  return join(encryptedDir, META_FILENAME);
};

const readMetaFromDisk = async ({
  fs,
  encryptedDir,
}: {
  fs: FS;
  encryptedDir: string;
}): Promise<EncryptedMeta> => {
  console.log('#SbXtKQ', fs, encryptedDir);

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
  console.log('#3wQJK9', fs, encryptedDir, meta);
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
