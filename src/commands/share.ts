import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import {decrypt, readKey, readMessage, generateKey, encrypt, Message} from 'openpgp'
import * as yup from 'yup'
import api from '../services/api'
import ApiError from '../services/api/error'
import config from '../services/config'
import deriveEncryptionKey from '../services/crypto/deriveEncryptionKey'
import nameGenerator from '../services/nameGenerator'

export default class ShareSnipCommand extends Command {
  static description = 'Share an encrypted Snip via one-time URL';

  static flags = {
    help: flags.help({char: 'h'}),
    passphrase: flags.string({
      char: 'p',
      description: 'master passphrase used to protect your account key',
    }),
    profile: flags.string({
      description: 'account profile to use',
      default: 'default',
    }),
  };

  static examples = [
    '$ snip share DB_PASSWORD',
  ];

  static args = [{name: 'name'}];

  async run() {
    const {args, flags: {profile, ...mutableFlags}} = this.parse(ShareSnipCommand)
    let {name} = args
    let {passphrase} = mutableFlags

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    // 1. Prompt for secret name if no args sent.
    if (!name) {
      name = await this.promptForSecretName()
    }

    // 3. Determine which workspace to retrive the secret from.
    const workspaceId = userConfig.PersonalWorkspace.Id

    cli.action.start(chalk.green('Fetching secret'))
    // 4. Decrypt workspace private key.
    const {SecretEncryptedContent, WorkspaceEncryptedPrivateKey} = await api.getSecret({
      WorkspaceId: workspaceId,
      SecretName: name,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })
    cli.action.stop('✅')

    // 2. Prompt for account key master passphrase if no flags sent.
    if (!passphrase) {
      passphrase = await this.promptForPassphrase()
    }

    cli.action.start(chalk.green('Decrypting secret'))
    const {encryptionKey} = deriveEncryptionKey({
      passphrase,
      salt: Buffer.from(userConfig.Account.EncryptionKeySalt, 'base64'),
    })

    const {data: accountPrivateKey} = await decrypt({
      message: await readMessage({armoredMessage: userConfig.Account.EncryptedPrivateKey}),
      passwords: [encryptionKey],
    })

    const {data: workspacePrivateKey} = await decrypt({
      message: await readMessage({armoredMessage: WorkspaceEncryptedPrivateKey}),
      privateKeys: [
        await readKey({armoredKey: accountPrivateKey}),
      ],
    })

    // 6. Decrypt secret.
    const {data: secretValue} = await decrypt({
      message: await readMessage({
        armoredMessage: SecretEncryptedContent,
      }),
      privateKeys: [
        await readKey({armoredKey: workspacePrivateKey}),
      ],
    })

    const {publicKeyArmored, privateKeyArmored} = await generateKey({
      type: 'ecc',
      curve: 'p256',
      userIds: [{name}],
      // Passphrase not used as workspace private keys will be
      // encrypted as messages with multiple public keys.
    })

    const encryptedContent = await encrypt({
      message: Message.fromText(secretValue),
      publicKeys: [await readKey({armoredKey: publicKeyArmored})],
      privateKeys: [await readKey({armoredKey: privateKeyArmored})],
    })

    const {encryptionKey: oneTimeSecretEncryptionKey} = deriveEncryptionKey({passphrase: nameGenerator(), keySize: 16, encoding: 'base64'})

    const urlSafeoneTimeSecretEncryptionKey = oneTimeSecretEncryptionKey.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '')

    const encryptedPrivateKey = await encrypt({
      message: Message.fromText(privateKeyArmored),
      passwords: [urlSafeoneTimeSecretEncryptionKey],
    })

    const oneTimeSecret = await api.createOneTimeSecret({
      OneTimeSecretName: name,
      OneTimeSecretPublicKey: publicKeyArmored,
      OneTimeSecretEncryptedPrivateKey: encryptedPrivateKey,
      OneTimeSecretEncryptedContent: encryptedContent as string,
    }, {ApiKey: userConfig.Device.ApiKey})
    cli.action.stop('✅')

    const url = `https://secure.sniptt.com/view?id=${oneTimeSecret.OneTimeSecretId}&token=${urlSafeoneTimeSecretEncryptionKey}`

    this.goodbye({url})
  }

  async catch(error: string | ApiError) {
    if (error instanceof ApiError) {
      const {code, message, hint} = error

      this.error(message, {
        code,
        suggestions: hint ? [hint] : [],
      })
    }

    throw error
  }

  private goodbye({url}: { url: string }): never {
    this.log(chalk.reset(`
✨ Successfully created one time secret.

Please note that once viewed, the secret will no longer be available.

${chalk.bold(url)}
`))

    // Exit cleanly.
    this.exit(100)
  }

  private async promptForSecretName(): Promise<string> {
    const secretNameSchema = yup.string().max(64).required()

    const {secretName} = await prompt<{ secretName: string }>({
      type: 'input',
      name: 'secretName',
      message: chalk.bold('What is the name of the snip you would like to get?'),
      required: true,
      validate: async value => {
        try {
          await secretNameSchema.validate(value)
          return true
        } catch (error) {
          return error.message
        }
      },
    })

    return secretName
  }

  private async promptForPassphrase(): Promise<string> {
    const accountPassphraseSchema = yup.string().min(12).max(256).required()

    const {accountPassphrase} = await prompt<{ accountPassphrase: string }>({
      type: 'invisible',
      name: 'accountPassphrase',
      message: chalk.bold('Please enter your account master passphrase'),
      required: true,
      validate: async value => {
        try {
          await accountPassphraseSchema.validate(value)
          return true
        } catch (error) {
          return error.message
        }
      },
    })

    return accountPassphrase
  }
}
