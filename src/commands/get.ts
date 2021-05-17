import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import {decrypt, readKey, readMessage} from 'openpgp'
import * as yup from 'yup'
import api from '../services/api'
import ApiError from '../services/api/error'
import config from '../services/config'
import deriveEncryptionKey from '../services/crypto/deriveEncryptionKey'

export default class GetSnipCommand extends Command {
  static description = 'Get encrypted Snip from a workspace';

  static flags = {
    help: flags.help({char: 'h'}),
    workspace: flags.string({
      char: 'w',
      description: 'workspace name',
    }),
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
    '$ snip get "satoshi"',
    '$ snip get "satoshi" --workspace "devs"',
  ];

  static args = [{name: 'name'}];

  async run() {
    const {args, flags: {profile, ...mutableFlags}} = this.parse(GetSnipCommand)
    let {name} = args
    let {passphrase, workspace: workspaceName} = mutableFlags

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    // 1. Prompt for secret name if no args sent.
    if (!name) {
      name = await this.promptForSecretName()
    }

    // 2. Prompt for account key master passphrase if no flags sent.
    if (!passphrase) {
      passphrase = await this.promptForPassphrase()
    }

    // 3. Determine which workspace to retrive the secret from.
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
        workspaceName = workspaceMemberships.find(w => w.WorkspaceId === workspaceId)?.WorkspaceName
      }
    }

    // 4. Decrypt workspace private key.
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

    // 5. Fetch encrypted secret.
    cli.action.start(chalk.green('Getting encrypted secret from workspace'))
    const {SecretEncryptedContent} = await api.getSecret({
      WorkspaceId: workspaceId,
      SecretName: name,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })
    cli.action.stop('✅')

    // 6. Decrypt secret.
    cli.action.start(chalk.green('Decrypting secret'))
    const {data: secretValue} = await decrypt({
      message: await readMessage({
        armoredMessage: SecretEncryptedContent,
      }),
      privateKeys: [
        await readKey({armoredKey: personalWorkspacePrivateKey}),
      ],
    })
    cli.action.stop('✅')

    // 7. Print secret message.
    this.goodbye({secretName: name, secretValue, workspaceName})
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

  private goodbye({secretName, secretValue, workspaceName = 'personal'}: { secretName: string; secretValue: string; workspaceName?: string }): never {
    this.log(chalk.reset(`
🔒 Successfully decrypted secret, ${chalk.bold.yellow(secretName)}, from workspace, ${chalk.bold.yellow(workspaceName)}:

    ${chalk.bold.cyan(secretValue)}
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

  private async promptForWorkspaceId(workspaceName: string, workspaceMemberships: Array<{ WorkspaceName: string; WorkspaceId: string; Role: string; AccountName: string; AccountEmail: string }>): Promise<string> {
    const {workspaceId} = await prompt<{ workspaceId: string }>({
      type: 'select',
      name: 'workspaceId',
      message: chalk.bold(`You belong to multiple workspaces with the name ${chalk.magenta(workspaceName)}. Which one did you mean?`),
      choices: workspaceMemberships.map(workspaceMembership => ({
        name: workspaceMembership.WorkspaceId,
        message: `${workspaceMembership.WorkspaceName} (${workspaceMembership.Role})`,
        value: workspaceMembership.WorkspaceId,
        hint: `${workspaceMembership.AccountName} <${workspaceMembership.AccountEmail}>`,
      })),
      required: true,
    })

    return workspaceId
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
}
