import chalk from 'chalk';

export const secretDeleted = ({
  secretName,
  vaultName,
  vaultId,
  json,
}: {
  secretName: string;
  vaultName: string | undefined;
  vaultId: string;
  json: boolean | undefined;
}): never => {
  if (json) {
    process.stdout.write(JSON.stringify({ VaultId: vaultId }, null, 2));
    process.exit(0);
  }

  process.stdout.write(`
✨ ${chalk.cyan(secretName)} deleted from ${chalk.cyan(
    vaultName ? vaultName : 'Personal',
  )} vault!

`);
  process.exit(0);
};
