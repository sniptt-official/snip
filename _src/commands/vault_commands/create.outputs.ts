import chalk from 'chalk';

export const vaultCreated = ({
  vaultId,
  vaultName,
  json,
}: {
  vaultId: string;
  vaultName: string;
  json: boolean | undefined;
}): never => {
  if (json) {
    process.stdout.write(
      JSON.stringify({ VaultId: vaultId, VaultName: vaultName }, null, 2),
    );

    process.exit(0);
  }

  process.stdout.write(`
✨ Vault ${chalk.cyan(vaultName)} created!

To add a secret:

    ${chalk.bold(
      `$ snip add DB_PASSWORD zHE4JDdYCNo5zJR9 --vault "${vaultName}"`,
    )}

To add a member:

    ${chalk.bold(
      `$ snip vault add-member "${vaultName}" --email bob@example.com`,
    )}

`);

  process.exit(0);
};
