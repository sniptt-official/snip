import type { Arguments, CommandBuilder } from 'yargs';

export const command: string = 'vault <command>';
export const desc: string = 'Manage vaults';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('vault_commands');
export const handler = (_argv: Arguments) => {};
