import ora from 'ora';
import { readFile, statSync } from 'fs-extra';

import { Builder, Handler } from './share.types';
import * as prompts from './share.prompts';
import * as outputs from './share.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';
import crypto from '../../services/crypto';

export const command: string = 'share [value]';
export const desc: string = 'Create one-time end-to-end encrypted secret';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      file: { type: 'string', alias: 'f', conflicts: 'value' },
      curve: {
        type: 'string',
        desc: 'ecc curve name used to generate one-time secret keys',
        alias: 'c',
        choices: crypto.constants.ECC_CURVES,
        default: 'curve25519' as const,
      },
    })
    .positional('value', { type: 'string', conflicts: 'file' })
    .check((argv, _options) => {
      const { value, file } = argv;

      let contentLength: number;

      if (file) {
        contentLength = statSync(file).size;
      } else if (value) {
        contentLength = Buffer.from(value, 'utf8').length;
      } else {
        throw new Error('must provide value or file as input');
      }

      if (contentLength > 10_000) {
        throw new Error('size of input binary cannot exceed 10kB');
      }

      return argv;
    });

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, value, file, curve, json } = argv;

  const userConfig = await readUserConfig(profile);

  const { content, contentType } = await getBinaryValue({ file, value });

  spinner.start('Encrypting contents');
  const { encryptionKey } = crypto.deriveEncryptionKey({});

  const keyPair = await crypto.generateOneTimeSecretKeyPair({
    accountEmail: userConfig.Account.Email,
    accountName: userConfig.Account.Name,
    encryptionKey,
    curve,
  });

  const encryptedContent = await crypto.encryptBinaryWithKeyPair({
    binary: content,
    ...keyPair,
  });
  spinner.succeed();

  spinner.start('Obtaining one-time url');
  const { OneTimeSecretId: oneTimeSecretId } = await api.createOneTimeSecret(
    {
      OneTimeSecretPublicKey: keyPair.publicKey,
      OneTimeSecretEncryptedPrivateKey: keyPair.encryptedPrivateKey,
      OneTimeSecretEncryptedContent: encryptedContent,
      OneTimeSecretContentType: contentType === 'file' ? 'File' : 'Text',
    },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.oneTimeSecretCreated({
    oneTimeSecretId,
    token: encryptionKey,
    json,
  });
};

const getBinaryValue = async ({
  file,
  value,
}: {
  file: string | undefined;
  value: string | undefined;
}): Promise<{ contentType: 'file' | 'text'; content: Buffer }> => {
  if (file) {
    return { contentType: 'file', content: await readFile(file) };
  } else if (value) {
    return { contentType: 'text', content: Buffer.from(value, 'utf8') };
  } else {
    throw new Error('must provide value or file as input');
  }
};
