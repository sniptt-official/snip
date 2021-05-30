import chalk from 'chalk';
import { writeFileSync } from 'fs-extra';

export const secretRetrieved = ({
  secretId,
  secretName,
  secretContent,
  secretContentType,
  vaultName,
  json,
  output,
}: {
  secretId: string;
  secretName: string;
  secretContent: Buffer;
  secretContentType: string;
  vaultName: string | undefined;
  json: boolean | undefined;
  output: string | undefined;
}) => {
  if (typeof output === 'string') {
    const fileName = output === '' ? secretName : output;
    writeFileSync(fileName, secretContent);
    process.exit(0);
  }

  if (json) {
    const encoding = secretContentType === 'File' ? 'base64' : 'utf8';

    process.stdout.write(
      JSON.stringify(
        {
          SecretId: secretId,
          SecretName: secretName,
          SecretContentType: secretContentType,
          SecretContent: secretContent.toString(encoding),
          SecretContentEncoding: encoding,
        },
        null,
        2,
      ),
    );

    process.exit(0);
  }

  process.stdout.write(`
✨ ${chalk.cyan(secretName)} retrieved from ${chalk.cyan(
    vaultName ? vaultName : 'Personal',
  )} vault!

${chalk.bold.green(secretContent)}

`);

  process.exit(0);
};
