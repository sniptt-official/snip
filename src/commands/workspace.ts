import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import {decrypt, readMessage, readKey, encrypt, Message, EllipticCurveName} from 'openpgp'
import * as yup from 'yup'
import api from '../services/api'
import ApiError from '../services/api/error'
import config from '../services/config'
import {constants} from '../services/crypto'
import generateWorkspaceKeys from '../services/crypto/generateWorkspaceKeys'
import deriveEncryptionKey from '../services/crypto/deriveEncryptionKey'
import generateName from '../services/nameGenerator'
import {UserConfig} from '../services/config'

export default class WorkspaceSnipCommand extends Command {
  static description = 'Manage workspaces';

  static flags = {
    help: flags.help({char: 'h'}),
    curve: flags.enum<EllipticCurveName>({
      char: 'c',
      description: 'ecc curve name used to generate workspace keys',
      options: constants.ECC_CURVES,
      default: 'curve25519',
    }),
    email: flags.string({
      char: 'e',
      description: 'email of account to invite',
    }),
    passphrase: flags.string({
      char: 'p',
      description: 'master passphrase used to protect your account key',
    }),
    profile: flags.string({
      description: 'account profile to use',
      default: 'default',
    }),
    ...cli.table.flags(),
  };

  static examples = [
    '$ snip workspace ls',
    '$ snip workspace create',
    '$ snip workspace create devs',
    '$ snip workspace add-member devs -e bob@example.com',
    '$ snip workspace list-members devs',
  ];

  static args = [{name: 'action', type: 'string', required: true, options: ['ls', 'create', 'add-member', 'list-members']}, {name: 'name', type: 'string'}];

  async run() {
    const {args: {action, ...mutableArgs}, flags: {profile, curve, ...mutableFlags}} = this.parse(WorkspaceSnipCommand)
    let {name: workspaceName} = mutableArgs
    let {email, passphrase, ...tableFlags} = mutableFlags

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    if (action === 'ls') {
      await this.listWorkspaces({
        userConfig,
        ...tableFlags,
      })
    }

    // 1. Prompt for workspace name if no arguments sent.
    if (!workspaceName) {
      workspaceName = await this.promptForWorkspaceName(action)
    }

    if (action === 'create') {
      await this.createWorkpace({
        userConfig,
        workspaceName,
        curve,
      })
    }

    if (action === 'add-member') {
      if (!email) {
        email = await this.promptForEmail()
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

      await this.addMemberToWorkspace({
        userConfig,
        workspaceName,
        workspaceId,
        passphrase,
        email,
      })
    }

    if (action === 'list-members') {
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

      await this.listWorkspaceMembers({userConfig, workspaceId, ...tableFlags})
    }
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

  async listWorkspaces({userConfig, ...tableFlags}: { userConfig: UserConfig }) {
    const result = await api.listWorkspaces({}, {
      ApiKey: userConfig.Device.ApiKey,
    })

    cli.table(result, {
      WorkspaceId: {
        header: 'WorkspaceId',
        get: row => row.WorkspaceId,
        extended: true,
      },
      WorkspaceName: {
        header: 'WorkspaceName',
        get: row => row.WorkspaceName,
      },
      Role: {
        header: 'Role',
        get: row => row.Role,
      },
    }, {
      printLine: this.log,
      ...tableFlags, // parsed flags
    })

    // Exit cleanly.
    this.exit(100)
  }

  async listWorkspaceMembers({userConfig, workspaceId, ...tableFlags}: { userConfig: UserConfig; workspaceId: string }) {
    const result = await api.listWorkspaceMembers({
      WorkspaceId: workspaceId,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })

    cli.table(result, {
      AccountId: {
        header: 'AccountId',
        get: row => row.AccountId,
        extended: true,
      },
      AccountName: {
        header: 'AccountName',
        get: row => row.AccountName,
      },
      AccountEmail: {
        header: 'AccountEmail',
        get: row => row.AccountEmail,
      },
      Role: {
        header: 'Role',
        get: row => row.Role,
      },
    }, {
      printLine: this.log,
      ...tableFlags, // parsed flags
    })

    // Exit cleanly.
    this.exit(100)
  }

  async createWorkpace({userConfig, workspaceName, curve}: { userConfig: UserConfig; workspaceName: string; curve: EllipticCurveName }): Promise<never> {
    cli.action.start(chalk.green('Generating workspace keys'))
    const keys = await generateWorkspaceKeys({
      accountPublicKey: userConfig.Account.PublicKey,
      email: userConfig.Account.Email,
      name: workspaceName,
      curve,
    })
    cli.action.stop('✅')

    cli.action.start(chalk.green('Creating workspace'))
    await api.createWorkspace({
      WorkspaceEncryptedPrivateKey: keys.encryptedPrivateKey,
      WorkspaceName: workspaceName,
      WorkspacePublicKey: keys.publicKey,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })
    cli.action.stop('✅')

    this.log(chalk.reset(`
Workspace ${chalk.bold.cyan(workspaceName)} created! 🚀

Let's try adding a new snip:

    ${chalk.bold(`$ snip add DB_PASSWORD AYYGR3h64tHp9Bne --workspace ${workspaceName}`)}
`))

    // Exit cleanly.
    this.exit(100)
  }

  async addMemberToWorkspace({userConfig, workspaceName, workspaceId, email, passphrase}: { userConfig: UserConfig; workspaceName: string; workspaceId: string; email: string; passphrase: string }) {
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

    this.log(chalk.reset(`
Member ${chalk.bold.cyan(email)} added to ${chalk.bold.cyan(workspaceName)}! 🚀
`))

    // Exit cleanly.
    this.exit(100)
  }

  private async promptForWorkspaceName(action: 'create' | 'add-member'): Promise<string> {
    const workspaceNameSchema = yup.string().min(1).max(64).required()

    const message = action === 'create' ?
      chalk.bold('What should we name your Sniptt workspace?') :
      chalk.bold('What\'s the name of the workspace you\'d like to add a member to?')

    const {workspaceName} = await prompt<{ workspaceName: string }>({
      type: 'input',
      name: 'workspaceName',
      message: message,
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
