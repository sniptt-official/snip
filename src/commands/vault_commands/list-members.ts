import ora from 'ora';

import { Builder, Handler } from './list-members.types';
import * as prompts from './list-members.prompts';
import * as outputs from './list-members.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';

export const command: string = 'list-members <name>';
export const desc: string = 'List members of vault';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
    })
    .positional('name', { type: 'string', demandOption: true })
    .example([
      // ['$0 vault list-members'],
      ['$0 vault list-members devs'],
      ['$0 vault list-members devs -q --json | jq -r ".[].AccountId"'],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, name: vaultName, json } = argv;

  const userConfig = await readUserConfig(profile);

  spinner.start('Fetching existing vault memberships');
  const vaultMemberships = await api.searchVaultMemberships(
    { VaultName: vaultName },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  const vaultId = await prompts.confirmVaultId({ vaultMemberships });

  spinner.start(`Fetching vault members for ${vaultName}`);
  const vaultMembers = await api.listVaultMembers(
    { VaultId: vaultId },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.listVaultMemberships({
    vaultMembers,
    json,
  });
};
