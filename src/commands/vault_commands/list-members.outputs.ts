import Table from 'cli-table';
import { EOL } from 'os';

export const listVaultMemberships = ({
  vaultMembers,
  json,
}: {
  vaultMembers: Array<{
    Role: string;
    AccountId: string;
    AccountName: string;
    AccountEmail: string;
    AccountPublicKey: string;
  }>;
  json: boolean | undefined;
}) => {
  if (json) {
    process.stdout.write(JSON.stringify(vaultMembers, null, 2));
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
    head: ['Email', 'Name', 'Role'],
    style: {
      head: ['reset'],
      border: ['reset'],
      'padding-left': 0,
      'padding-right': 0,
    },
  });

  vaultMembers.forEach(({ Role, AccountName, AccountEmail }) => {
    table.push([AccountEmail, AccountName, Role]);
  });

  process.stdout.write(table.toString() + EOL);

  process.exit(0);
};
