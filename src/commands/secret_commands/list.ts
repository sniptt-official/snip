import ora from 'ora';

import { Builder, Handler } from './list.types';
import * as prompts from './list.prompts';
import * as outputs from './list.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';

export const command = 'list';
export const aliases: Array<string> = ['ls'];
export const desc = 'List vault secrets';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      vault: { type: 'string', alias: 'v' },
    })
    .example([
      ['$0 list'],
      ['$0 ls --profile project:phoenix'],
      ['$0 ls --vault devs'],
      ['$0 ls -v creds:aws -q --json | jq -r ".[].SecretId"'],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, vault: vaultName, json } = argv;

  const userConfig = await readUserConfig(profile);

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

  spinner.start('Fetching vault secrets');
  const vaultSecrets = await api.listVaultSecrets(
    { VaultId: vaultId },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.listVaultSecrets({
    vaultSecrets,
    json,
  });
};
