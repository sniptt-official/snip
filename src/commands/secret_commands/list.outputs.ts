import Table from 'cli-table';
import { EOL } from 'os';

export const listVaultSecrets = ({
  vaultSecrets,
  json,
}: {
  vaultSecrets: Array<{
    SecretId: string;
    SecretName: string;
    SecretOwnerAccountId: string;
    SecretOwnerAccountName: string;
    SecretOwnerAccountEmail: string;
  }>;
  json: boolean | undefined;
}): never => {
  if (json) {
    process.stdout.write(JSON.stringify(vaultSecrets, null, 2));
    process.exit(0);
  }

  const table = new Table({
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ' ',
    },
    head: ['Secret Name', 'Owner'],
    style: {
      head: ['reset'],
      border: ['reset'],
      'padding-left': 0,
      'padding-right': 0,
    },
  });

  vaultSecrets.forEach(
    ({ SecretName, SecretOwnerAccountName, SecretOwnerAccountEmail }) => {
      table.push([
        SecretName,
        `${SecretOwnerAccountName} <${SecretOwnerAccountEmail}>`,
      ]);
    },
  );

  process.stdout.write(table.toString() + EOL);

  process.exit(0);
};
