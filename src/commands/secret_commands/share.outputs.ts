import chalk from 'chalk';

export const oneTimeSecretCreated = ({
  oneTimeSecretId,
  token,
  json,
}: {
  oneTimeSecretId: string;
  token: string;
  json: boolean | undefined;
}): never => {
  const oneTimeSecretUrl = `https://secure.sniptt.com/view?id=${oneTimeSecretId}&token=${token}`;

  if (json) {
    process.stdout.write(
      JSON.stringify(
        {
          OneTimeSecretId: oneTimeSecretId,
          OneTimeSecretUrl: oneTimeSecretUrl,
        },
        null,
        2,
      ),
    );

    process.exit(0);
  }

  process.stdout.write(`
✨ One-time secret created!

Please note that once viewed, the secret will no longer be available.

To securely share once:

    ${chalk.bold(oneTimeSecretUrl)}

`);

  process.exit(0);
};
