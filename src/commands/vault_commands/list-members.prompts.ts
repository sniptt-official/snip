import { prompt } from 'enquirer';

export const confirmVaultId = async ({
  vaultMemberships,
}: {
  vaultMemberships: Array<{
    Role: string;
    VaultId: string;
    VaultName: string;
    VaultOwnerAccountName: string;
    VaultOwnerAccountEmail: string;
  }>;
}): Promise<string> => {
  if (vaultMemberships.length === 0) {
    throw new Error('vault not found');
  }

  if (vaultMemberships.length === 1) {
    const [vaultMembership] = vaultMemberships;
    return vaultMembership.VaultId;
  }

  if (vaultMemberships.length > 1) {
    const { vaultId: result } = await prompt<{
      vaultId: { [k: string]: string };
    }>({
      type: 'select',
      name: 'vaultId',
      message:
        'You are a member of multiple vaults with this name. Which one did you mean?',
      // NOTE: Resulting type cast as any due to a bug in
      // type definitions (name is required although it should not be).
      choices: vaultMemberships.map((vaultMembership) => ({
        name: `${vaultMembership.VaultName} (${vaultMembership.Role})`,
        value: vaultMembership.VaultId,
        hint: `Created by ${vaultMembership.VaultOwnerAccountName} <${vaultMembership.VaultOwnerAccountEmail}>`,
      })),
      result(res) {
        // NOTE: See https://github.com/enquirer/enquirer/blob/8d626c206733420637660ac7c2098d7de45e8590/examples/multiselect/option-result.js
        // for relevant example. Had to dig in to get to the bottom of this.
        // If we do not do this, it's pretty much impossible to maintain
        // user-friendly display names in options and confirms.
        // @ts-ignore
        return this.map(res);
      },
      required: true,
    });

    const [vaultId] = Object.values(result);

    return vaultId;
  }

  throw new Error('unexpected result');
};
