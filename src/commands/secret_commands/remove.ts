import ora from 'ora';

import { Builder, Handler } from './remove.types';
import * as prompts from './remove.prompts';
import * as outputs from './remove.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';

export const command = 'remove [name]';
export const aliases: Array<string> = ['rm'];
export const desc = 'Remove end-to-end encrypted secret from vault';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      vault: { type: 'string', alias: 'v' },
    })
    .positional('name', { type: 'string' })
    .example([
      ['$0 rm'],
      ['$0 rm DB_PASSWORD --profile project:phoenix'],
      ['$0 rm alice.csv --vault devs'],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, vault: vaultName, json } = argv;

  const userConfig = await readUserConfig(profile);

  const { name: secretName = await prompts.confirmSecretName() } = argv;

  let vaultId = userConfig.PersonalVault.Id;

  if (vaultName) {
    spinner.start('Fetching existing vault memberships');
    const vaultMemberships = await api.searchVaultMemberships(
      { VaultName: vaultName },
      { ApiKey: userConfig.Account.ApiKey },
    );
    spinner.succeed();

    vaultId = await prompts.confirmVaultId({ vaultMemberships });
  }

  spinner.start('Deleting secret from vault');
  await api.deleteSecret(
    {
      SecretName: secretName,
      VaultId: vaultId,
    },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.secretDeleted({ secretName, vaultName, vaultId, json });
};
