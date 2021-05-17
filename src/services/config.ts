import {readJson, outputJson} from 'fs-extra'
import {join} from 'path'

export type UserConfig = {
  Device: {
    Name: string;
    ApiKey: string;
  };
  Account: {
    Id: string;
    Email: string;
    // Name?: string;
    PublicKey: string;
    EncryptedPrivateKey: string;
    EncryptionKeySalt: string;
  };
  PersonalWorkspace: {
    Id: string;
    PublicKey: string;
    EncryptedPrivateKey: string;
  };
}

const read = async (configDir: string, profile: string): Promise<UserConfig | undefined> => {
  const userConfigPath = join(configDir, `${profile}.json`)

  try {
    const userConfig = await readJson(userConfigPath)
    return userConfig
  } catch (error) {
    return undefined
  }
}

const write = async (data: UserConfig, configDir: string, profile: string) => {
  const userConfigPath = join(configDir, `${profile}.json`)
  return outputJson(userConfigPath, data)
}

export default {
  read,
  write,
}
