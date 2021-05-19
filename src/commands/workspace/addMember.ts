import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import {decrypt, encrypt, Message, readKey, readMessage} from 'openpgp'
import * as yup from 'yup'
import api from '../../services/api'
import ApiError from '../../services/api/error'
import config from '../../services/config'
import deriveEncryptionKey from '../../services/crypto/deriveEncryptionKey'
import generateName from '../../services/nameGenerator'

export default class AddMemberToWorkspaceCommand extends Command {
  static description = 'Add member to Sniptt workspace';

  static flags = {
    help: flags.help({char: 'h'}),
    email: flags.string({
      char: 'e',
      description: 'email of account to invite',
    }),
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

  static examples = ['$ snip workspace:add-member -e "bob@example.com" -w "devs"'];

  async run() {
    const {flags: {profile, ...mutableFlags}} = this.parse(AddMemberToWorkspaceCommand)
    let {workspace: workspaceName, email, passphrase} = mutableFlags

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    // 1. Prompt for email of account to invite if no flags sent.
    if (!email) {
      email = await this.promptForEmail()
    }

    // 2. Prompt for workspace name if no flags sent.
    if (!workspaceName) {
      workspaceName = await this.promptForWorkspaceName({email})
    }

    // 3. Determine which workspace ID should be used.
    let workspaceId = userConfig.PersonalWorkspace.Id

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

    // 4. Prompt for account key master passphrase if no flags sent.
    if (!passphrase) {
      passphrase = await this.promptForPassphrase()
    }

    // 5. Fetch all existing workspace memberships.
    cli.action.start(chalk.green(`Fetching existing memberships for ${workspaceName}`))
    const [account, workspace, workspaceMembers] = await Promise.all([
      api.getAccount({AccountEmail: email}, {ApiKey: userConfig.Device.ApiKey}),
      api.getWorkspace({
        WorkspaceId: workspaceId,
      }, {ApiKey: userConfig.Device.ApiKey}),
      api.listWorkspaceMembers({
        WorkspaceId: workspaceId,
      }, {ApiKey: userConfig.Device.ApiKey}),
    ] as const)
    cli.action.stop('✅')

    if (!account.AccountPublicKey) {
      throw new Error('counterpart account not active')
    }

    // TODO: Check if membership already exists for given role.
    // TODO: Add support for roles, currently defaults to admin.
    const isMember = workspaceMembers.find(({AccountId}) => AccountId === account.AccountId)

    if (isMember) {
      throw new Error('email already in workspace')
    }

    // 6. Decrypt workspace private key, re-encrypt with
    // all existing public keys and new public key.
    cli.action.start(chalk.green('Decrypting workspace keys'))
    const {encryptionKey} = deriveEncryptionKey({
      passphrase,
      salt: Buffer.from(userConfig.Account.EncryptionKeySalt, 'base64'),
    })

    const {data: accountPrivateKey} = await decrypt({
      message: await readMessage({armoredMessage: userConfig.Account.EncryptedPrivateKey}),
      passwords: [encryptionKey],
    })

    const {data: workspacePrivateKey} = await decrypt({
      message: await readMessage({armoredMessage: workspace.WorkspaceEncryptedPrivateKey}),
      privateKeys: [
        await readKey({armoredKey: accountPrivateKey}),
      ],
    })
    cli.action.stop('✅')

    cli.action.start(chalk.green(`Adding ${email}'s public key`))
    // Concat all public keys (existing workspace memberships, and new public key).
    const existingPublicKeys = workspaceMembers.map(({AccountPublicKey}) => AccountPublicKey)
    // Prevent duplicates, although there should not be any by this point.
    const nextPublicKeys = new Set(existingPublicKeys)
    nextPublicKeys.add(account.AccountPublicKey)
    cli.action.stop('✅')

    cli.action.start(chalk.green('Encrypting workspace keys'))
    const workspaceEncryptedPrivateKey = await encrypt({
      message: Message.fromText(workspacePrivateKey),
      publicKeys: await Promise.all([...nextPublicKeys].map(publicKey => readKey({armoredKey: publicKey}))),
    })
    cli.action.stop('✅')

    // 7. Upload updated encrypted private key.
    cli.action.start(chalk.green('Updating workspace'))
    await api.addMemberToWorkspace({
      AccountEmail: email,
      WorkspaceId: workspaceId,
      WorkspaceEncryptedPrivateKey: workspaceEncryptedPrivateKey as string,
    }, {ApiKey: userConfig.Device.ApiKey})
    cli.action.stop('✅')

    // 8. Print message.
    this.goodbye({email, workspaceName})
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

  private goodbye({email, workspaceName}: { email: string; workspaceName: string }): never {
    this.log(chalk.reset(`
Member ${chalk.bold.cyan(email)} added to ${chalk.bold.cyan(workspaceName)}! 🚀
`))

    // Exit cleanly.
    this.exit(100)
  }

  private async promptForEmail(): Promise<string> {
    const accountEmailSchema = yup.string().email().required()

    const {accountEmail} = await prompt<{ accountEmail: string }>({
      type: 'input',
      name: 'accountEmail',
      message: chalk.bold('What\'s the email address of the user you\'d like to add?'),
      required: true,
      validate: async value => {
        try {
          await accountEmailSchema.validate(value)
          return true
        } catch (error) {
          return error.message
        }
      },
    })

    return accountEmail
  }

  private async promptForWorkspaceName({email}: { email: string }): Promise<string> {
    const workspaceNameSchema = yup.string().min(1).max(64).required()

    const {workspaceName} = await prompt<{ workspaceName: string }>({
      type: 'input',
      name: 'workspaceName',
      message: chalk.bold(`What's the name of the workspace you'd like to add ${chalk.cyan(email)} to?`),
      required: true,
      initial: generateName(),
      validate: async value => {
        try {
          await workspaceNameSchema.validate(value)
          return true
        } catch (error) {
          return error.message
        }
      },
    })

    return workspaceName
  }

  private async promptForWorkspaceId(workspaceName: string, workspaceMemberships: Array<{ WorkspaceName: string; WorkspaceId: string; Role: string; AccountName: string; AccountEmail: string }>): Promise<string> {
    const {workspaceId} = await prompt<{ workspaceId: string }>({
      type: 'select',
      name: 'workspaceId',
      message: chalk.bold(`You belong to multiple workspaces with the name ${chalk.cyan(workspaceName)}. Which one did you mean?`),
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
