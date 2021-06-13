import Table from 'cli-table';
import { EOL } from 'os';

export const listVaultMemberships = ({
  vaultMemberships,
  json,
}: {
  vaultMemberships: Array<{
    Role: string;
    VaultName: string;
    VaultOwnerAccountEmail: string;
    VaultOwnerAccountName: string;
  }>;
  json: boolean | undefined;
}): never => {
  if (json) {
    process.stdout.write(JSON.stringify(vaultMemberships, null, 2));
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
    head: ['Vault', 'Role', 'Owner'],
    style: {
      head: ['reset'],
      border: ['reset'],
      'padding-left': 0,
      'padding-right': 0,
    },
  });

  vaultMemberships.forEach(
    ({ Role, VaultName, VaultOwnerAccountEmail, VaultOwnerAccountName }) => {
      table.push([
        VaultName,
        Role,
        `${VaultOwnerAccountName} <${VaultOwnerAccountEmail}>`,
      ]);
    },
  );

  process.stdout.write(table.toString() + EOL);

  process.exit(0);
};
