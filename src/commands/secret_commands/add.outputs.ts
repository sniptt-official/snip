import chalk from 'chalk';

export const secretAdded = ({
  secretName,
  vaultName,
}: {
  secretName: string;
  vaultName: string | undefined;
}) => {
  process.stdout.write(`
✨ ${chalk.cyan(secretName)} added to ${chalk.cyan(
    vaultName ? vaultName : 'Personal',
  )} vault!

To view:

    ${chalk.bold(
      `$ snip get "${secretName}"${vaultName ? ` --vault "${vaultName}"` : ''}`,
    )}

`);

  process.exit(0);
};

export const secretAddedJson = ({
  secretId,
  vaultId,
}: {
  secretId: string;
  vaultId: string;
}) => {
  process.stdout.write(
    JSON.stringify({ SecretId: secretId, VaultId: vaultId }, null, 2),
  );

  process.exit(0);
};
