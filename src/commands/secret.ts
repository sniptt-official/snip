import type { Arguments, CommandBuilder } from 'yargs';

export const command: string = 'secret <command>';
export const desc: string = 'Manage secrets';
export const builder: CommandBuilder = (yargs) =>
  yargs.commandDir('secret_commands');
export const handler = (_argv: Arguments) => {};
