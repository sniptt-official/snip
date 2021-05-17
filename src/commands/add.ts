import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import {decrypt, encrypt, Message, readKey, readMessage} from 'openpgp'
import * as yup from 'yup'
import api from '../services/api'
import ApiError from '../services/api/error'
import config from '../services/config'
import deriveEncryptionKey from '../services/crypto/deriveEncryptionKey'
import generateName from '../services/nameGenerator'

export default class AddSnipCommand extends Command {
  static description = 'Add encrypted Snip to a workspace';

  static flags = {
    help: flags.help({char: 'h'}),
    name: flags.string({char: 'n', description: 'secret name'}),
    passphrase: flags.string({
      char: 'p',
      description: 'master passphrase used to protect your account key',
    }),
    profile: flags.string({
      description: 'account profile to use',
      default: 'default',
    }),
    workspace: flags.string({
      char: 'w',
      description: 'name of workspace to store secret',
    }),
  };

  static examples = [
    '$ snippt add "super secret" --name "satoshi"',
    '$ snippt add "super secret" --name "satoshi" --workspace "devs"',
  ];

  static args = [{name: 'value'}];

  async run() {
    const {args: {value}, flags: {profile, workspace: workspaceName, ...mutableFlags}} = this.parse(AddSnipCommand)
    let {name, passphrase} = mutableFlags

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    // NOTE: For now only support string values.
    // TODO: In future, we should support files (in any format).
    if (typeof value !== 'string') {
      throw new TypeError('secret value must be a string')
    }

    if (!name) {
      name = await this.promptForSecretName()
    }

    if (!passphrase) {
      passphrase = await this.promptForPassphrase()
    }

    let workspaceId = userConfig.PersonalWorkspace.Id

    if (workspaceName) {
      const workspaceMemberships = await api.searchWorkspaceMemberships({
        WorkspaceName: workspaceName,
      }, {
        ApiKey: userConfig.Device.ApiKey,
      })

      if (workspaceMemberships.length === 0) {
        throw new Error('workspace not found')
      }

      if (workspaceMemberships.length === 1) {
        workspaceId = workspaceMemberships[0]?.WorkspaceId!
      }

      if (workspaceMemberships.length > 1) {
        workspaceId = await this.promptForWorkspaceId(workspaceName, workspaceMemberships)
      }
    }

    cli.action.start(chalk.green('Decrypting account keys'))
    const {encryptionKey} = deriveEncryptionKey({
      passphrase,
      salt: Buffer.from(userConfig.Account.EncryptionKeySalt, 'base64'),
    })

    const {data: accountPrivateKey} = await decrypt({
      message: await readMessage({armoredMessage: userConfig.Account.EncryptedPrivateKey}),
      passwords: [encryptionKey],
    })

    const {data: personalWorkspacePrivateKey} = await decrypt({
      message: await readMessage({armoredMessage: userConfig.PersonalWorkspace.EncryptedPrivateKey}),
      privateKeys: [
        await readKey({armoredKey: accountPrivateKey}),
      ],
    })
    cli.action.stop('✅')

    cli.action.start(chalk.green('Encrypting secret'))
    const message = await encrypt({
      message: Message.fromText(value),
      publicKeys: [
        await readKey({armoredKey: userConfig.PersonalWorkspace.PublicKey}),
      ],
      // NOTE: Below only used for embedding a signature.
      // Can be used later to verify the signature(s).
      privateKeys: [
        await readKey({armoredKey: personalWorkspacePrivateKey}),
      ],
    })
    cli.action.stop('✅')

    cli.action.start(chalk.green('Adding secret to workspace'))
    const response = await api.addSecret({
      WorkspaceId: workspaceId,
      SecretName: name,
      SecretEncryptedContent: message as string,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })
    cli.action.stop('✅')

    this.goodbye({name, id: response.SecretId, workspaceName})
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

  private goodbye({name, id, workspaceName}: { name: string; id: string; workspaceName?: string }): never {
    this.log(chalk.reset(`
Secret ${chalk.bold.cyan(`${name} <${id}>`)} added! 🚀

To view this snip later, use the following:

    ${chalk.bold(`$ snip get "${name}"${workspaceName ? ` --workspace ${workspaceName}` : ''}`)}
`))

    // Exit cleanly.
    this.exit(100)
  }

  private async promptForSecretName(): Promise<string> {
    const secretNameSchema = yup.string().min(1).max(64).required()

    const {secretName} = await prompt<{ secretName: string }>({
      type: 'input',
      name: 'secretName',
      message: chalk.bold('What would you like to call your secret?'),
      required: true,
      initial: generateName(),
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
      type: 'password',
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

  private async promptForWorkspaceId(workspaceName: string, workspaceMemberships: Array<{ WorkspaceName: string; WorkspaceId: string; Role: string; AccountName: string; AccountEmail: string }>): Promise<string> {
    const {workspaceId} = await prompt<{ workspaceId: string }>({
      type: 'select',
      name: 'workspaceId',
      message: chalk.bold(`You belong to multiple workspaces with the name ${chalk.cyan(workspaceName)}. Which one did you mean?`),
      choices: workspaceMemberships.map(workspaceMembership => ({
        name: `${workspaceMembership.WorkspaceName} (${workspaceMembership.Role})`,
        value: workspaceMembership.WorkspaceId,
        hint: `${workspaceMembership.AccountName} <${workspaceMembership.AccountEmail}>`,
      })),
      required: true,
    })

    return workspaceId
  }
}
