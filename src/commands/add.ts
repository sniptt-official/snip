import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import {readFileSync} from 'fs'
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
    passphrase: flags.string({
      char: 'p',
      description: 'master passphrase used to protect your account key',
    }),
    file: flags.string({
      char: 'f',
      description: 'file to use as input',
    }),
    // encoding: flags.enum<BufferEncoding>({
    //   char: 'e',
    //   description: 'parse value or file with specified encoding',
    //   options: ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'binary', 'hex'],
    // }),
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
    '$ snip add DB_PASSWORD AYYGR3h64tHp9Bne',
    '$ snip add "local dev env" --file .env.local --workspace devs',
    '$ snip add --file .env.prod --workspace phoenix:automation',
  ];

  static args = [{name: 'name'}, {name: 'value'}];

  async run() {
    const {args, flags: {profile, workspace: workspaceName, file, ...mutableFlags}} = this.parse(AddSnipCommand)
    let {passphrase} = mutableFlags
    let {name, value} = args
    let inputType: 'value' | 'file'

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    if (!name) {
      name = await this.promptForSecretName()
    }

    if (typeof value === 'string') {
      if (typeof file === 'string') {
        throw new TypeError('cannot provide both value and filename as input, please choose one')
      }

      inputType = 'value'
      value = Buffer.from(value)
    } else if (typeof file === 'string') {
      inputType = 'file'
      // TODO: Perform presence and size check here to avoid
      // reading file into memory for no reason.
      value = readFileSync(file)
    } else {
      inputType = await this.promptForInputType()
    }

    if (!(value instanceof Buffer)) {
      value = inputType === 'value' ?
        await this.promptForInputValue() : await this.promptForInputFilename()
    }

    if (value.length > 10_000) {
      throw new Error('size of input cannot exceed 10kB')
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

    cli.action.start(chalk.green('Decrypting keys'))
    const {WorkspacePublicKey, WorkspaceEncryptedPrivateKey} = await api.getWorkspace({
      WorkspaceId: workspaceId,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })

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
    cli.action.stop('✅')

    cli.action.start(chalk.green('Encrypting secret'))
    const message = await encrypt({
      message: Message.fromBinary(value),
      publicKeys: [
        await readKey({armoredKey: WorkspacePublicKey}),
      ],
      // NOTE: Below only used for embedding a signature.
      // Can be used later to verify the signature(s).
      privateKeys: [
        await readKey({armoredKey: workspacePrivateKey}),
      ],
    })
    cli.action.stop('✅')

    cli.action.start(chalk.green('Adding secret to workspace'))
    await api.addSecret({
      WorkspaceId: workspaceId,
      SecretName: name,
      SecretEncryptedContent: message as string,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })
    cli.action.stop('✅')

    this.goodbye({name, workspaceName})
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

  private goodbye({name, workspaceName}: { name: string; workspaceName?: string }): never {
    this.log(chalk.reset(`
✨ ${chalk.bold.cyan(name)} added to ${chalk.bold.cyan(workspaceName ? workspaceName : 'Personal')} workspace!

To view:

    ${chalk.bold(`$ snip get "${name}"${workspaceName ? ` --workspace ${workspaceName}` : ''}`)}

To share:

    ${chalk.bold(`$ snip share "${name}"${workspaceName ? ` --workspace ${workspaceName}` : ''}`)}
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

  private async promptForInputType(): Promise<'value' | 'file'> {
    const {inputType} = await prompt<{ inputType: 'value' | 'file' }>({
      type: 'select',
      name: 'inputType',
      message: chalk.bold('What type of input would you like to use?'),
      choices: ['value', 'file'],
      required: true,
    })

    return inputType
  }

  private async promptForInputValue(): Promise<Buffer> {
    const {inputValue} = await prompt<{ inputValue: string }>({
      type: 'invisible',
      name: 'inputValue',
      message: chalk.bold(`What is the secret you'd like to encrypt? ${chalk.cyan('(input will be hidden)')}`),
      required: true,
    })

    return Buffer.from(inputValue)
  }

  private async promptForInputFilename(): Promise<Buffer> {
    const {inputFilename} = await prompt<{ inputFilename: string }>({
      type: 'input',
      name: 'inputFilename',
      message: chalk.bold('What is the path of the file you\'d like to encrypt?'),
      required: true,
    })

    // TODO: Perform presence and size check here to avoid
    // reading file into memory for no reason.
    return readFileSync(inputFilename)
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
