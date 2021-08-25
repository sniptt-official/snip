import type { Arguments, CommandBuilder } from 'yargs';

export const command = 'vault <command>';
export const desc = 'Manage vaults';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('vault_commands');
export const handler = (_argv: Arguments): void => undefined;
