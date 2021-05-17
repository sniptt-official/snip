import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import * as openpgp from 'openpgp'
import * as yup from 'yup'
import api from '../../services/api'
import ApiError from '../../services/api/error'
import config from '../../services/config'
import {constants} from '../../services/crypto'
import generateWorkspaceKeys from '../../services/crypto/generateWorkspaceKeys'
import generateName from '../../services/nameGenerator'

export default class AddSnipCommand extends Command {
  static description = 'Create new Sniptt workspace';

  static flags = {
    help: flags.help({char: 'h'}),
    curve: flags.enum<openpgp.EllipticCurveName>({
      char: 'c',
      description: 'ecc curve name used to generate workspace keys',
      options: constants.ECC_CURVES,
    }),
    profile: flags.string({
      description: 'account profile to use',
      default: 'default',
    }),
  };

  static examples = [
    '$ snip workspace:create',
    '$ snip workspace:create "devs"',
  ];

  static args = [{name: 'name', type: 'string'}];

  async run() {
    const {args, flags: {profile, ...mutableFlags}} = this.parse(AddSnipCommand)
    let {name} = args
    let {curve} = mutableFlags

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    // 1. Prompt for workspace name if no arguments sent.
    if (!name) {
      name = await this.promptForWorkspaceName()
    }

    // 2. Prompt for curve if flag not set.
    if (!curve) {
      curve = await this.promptForCurve()
    }

    // 3. Generate workspace keys.
    cli.action.start(chalk.green('Generating workspace keys'))
    const keys = await generateWorkspaceKeys({
      accountPublicKey: userConfig.Account.PublicKey,
      email: userConfig.Account.Email,
      name,
      curve,
    })
    cli.action.stop('✅')

    // 4. Create workspace.
    cli.action.start(chalk.green('Creating workspace'))
    const {WorkspaceId} = await api.createWorkspace({
      WorkspaceEncryptedPrivateKey: keys.encryptedPrivateKey,
      WorkspaceName: name,
      WorkspacePublicKey: keys.publicKey,
    }, {
      ApiKey: userConfig.Device.ApiKey,
    })
    cli.action.stop('✅')

    // 5. Print message.
    this.goodbye({workspacename: name, id: WorkspaceId})
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

  private goodbye({workspacename, id}: { workspacename: string; id: string }): never {
    this.log(chalk.reset(`
Workspace ${chalk.bold.cyan(`${workspacename} <${id}>`)} created! 🚀

Let's try adding a new snip:

    ${chalk.bold(`$ snip add "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" --name "satoshi" --workspace ${workspacename}`)}
`))

    // Exit cleanly.
    this.exit(100)
  }

  private async promptForWorkspaceName(): Promise<string> {
    const workspaceNameSchema = yup.string().min(1).max(64).required()

    const {workspaceName} = await prompt<{ workspaceName: string }>({
      type: 'input',
      name: 'workspaceName',
      message: chalk.bold('What should we name your Sniptt workspace?'),
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

  private async promptForCurve(): Promise<openpgp.EllipticCurveName> {
    const {curve} = await prompt<{ curve: openpgp.EllipticCurveName }>({
      type: 'select',
      name: 'curve',
      message: chalk.bold('Which ECC curve would you like to use to generate your account keys?'),
      initial: 0,
      choices: constants.ECC_CURVES.map(curve => ({
        name: curve,
        hint: curve === 'curve25519' ? 'recommended' : undefined,
      })),
      required: true,
    })

    return curve
  }
}
