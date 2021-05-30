import { outputJson, readJson } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';

export type UserConfig = {
  Device: {
    Id: string;
    UseKeychain: boolean;
  };
  Account: {
    Id: string;
    ApiKey: string;
    Email: string;
    Name: string;
    PublicKey: string;
    EncryptedPrivateKey: string;
    EncryptionKeySalt: string;
  };
  PersonalVault: {
    Id: string;
    PublicKey: string;
    EncryptedPrivateKey: string;
  };
};

export const writeUserConfig = async (
  profile: string,
  userConfig: UserConfig,
): Promise<string> => {
  const configPath = join(
    homedir(),
    '.config',
    'sniptt-next',
    `${profile}.json`,
  );
  await outputJson(configPath, userConfig);
  return configPath;
};

export const readUserConfig = async (profile: string): Promise<UserConfig> => {
  const configPath = join(
    homedir(),
    '.config',
    'sniptt-next',
    `${profile}.json`,
  );
  const userConfig = await readJson(configPath);
  return userConfig;
};
