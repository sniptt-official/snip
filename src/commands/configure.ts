import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import * as openpgp from 'openpgp'
import * as os from 'os'
import {promisify} from 'util'
import * as yup from 'yup'
import api from '../services/api'
import ApiError from '../services/api/error'
import config, {UserConfig} from '../services/config'
import {constants, generateAccountConfigurationKeys} from '../services/crypto'
import generateName from '../services/nameGenerator'
const Image = require('ascii-art-image')

export default class ConfigureCommand extends Command {
  static description = 'Configure Sniptt';

  static flags = {
    email: flags.string({
      char: 'e',
      description: 'email associated with the account',
    }),
    name: flags.string({
      char: 'n',
      description: 'name associated with the account',
    }),
    curve: flags.enum<openpgp.EllipticCurveName>({
      char: 'c',
      description: 'ecc curve name used to generate account keys',
      options: constants.ECC_CURVES,
    }),
    passphrase: flags.string({
      char: 'p',
      description: 'master passphrase used to protect your account key',
    }),
    profile: flags.string({
      description: 'namespace to associate this account configuration with',
      default: 'default',
    }),
  };

  static examples = [
    '$ snip configure --email "alice@example.com"',
    '$ snip configure --email "alice@example.com" --name "Alice personal 👩‍💻" --passphrase "numbingrelatableliquefy"',
    '$ snip configure --email "alice@example.com" --curve "brainpoolP256r1" --profile "personal"',
  ];

  async run() {
    // Print welcome text.
    await this.welcomeUser()

    // Parse the command.
    const {flags: {profile, ...mutableFlags}} = this.parse(ConfigureCommand)
    let {email, name, passphrase, curve} = mutableFlags

    // If user config is already present for given profile, return a friendly message.
    const existingUserConfig = await config.read(this.config.configDir, profile)

    if (existingUserConfig) {
      this.userConfigFound(profile)
    }

    // Proceed to account / device configuration.
    this.log(chalk(`
${chalk.bold('Welcome to Sniptt.')}

Sniptt is a ${chalk.bold('zero knowledge secret management system')}.

It allows you to easily protect and share secrets needed to access your applications, services, and IT resources.

Let's get started! 🚀
`))

    // TODO: Move to a flag and default it there.
    const deviceName = os.hostname()

    // 1. Prompt for email address if flag not set.
    if (!email) {
      email = await this.promptForEmail()
    }

    // 2. Send verification code to email address.
    cli.action.start(chalk.green('Sending email verification code'))
    await api.sendEmailVerificationCode({
      Email: email,
    })
    cli.action.stop('✅')

    // 3. Wait for OTP to be entered.
    const code = await this.promptForOtp({email})

    // 4. Create API key.
    cli.action.start(chalk.green('Registering device'))
    const {ApiKey, AccountId, PersonalWorkspaceId, ...existingAccountAttrs} = await api.createApiKey({
      Code: code,
      DeviceName: deviceName,
      Email: email,
    })
    cli.action.stop('✅')

    // 5a. Create local user config for given profile.
    const shouldSaveExistingExistingConfig = Object.keys(existingAccountAttrs).length !== 0
    if (shouldSaveExistingExistingConfig) {
      const userConfig: UserConfig = {
        Device: {
          Name: deviceName,
          ApiKey,
        },
        Account: {
          Id: AccountId,
          Email: email,
          PublicKey: existingAccountAttrs.AccountPublicKey!,
          EncryptedPrivateKey: existingAccountAttrs.AccountEncryptedPrivateKey!,
          EncryptionKeySalt: existingAccountAttrs.AccountEncryptionKeySalt!,
        },
        PersonalWorkspace: {
          Id: PersonalWorkspaceId,
          PublicKey: existingAccountAttrs.PersonalWorkspacePublicKey!,
          EncryptedPrivateKey: existingAccountAttrs.PersonalWorkspaceEncryptedPrivateKey!,
        },
      }

      await config.write(
        userConfig,
        this.config.configDir,
        profile
      )

      this.goodbye()
    }

    // 5b. Generate and upload account/workspace keys,
    // create local user config for given profile.
    if (!name) {
      name = await this.promptForAccountName()
    }

    if (!passphrase) {
      passphrase = await this.promptForPassphrase()
      await this.promptForConfirmPassphrase({passphrase})
    }

    if (!curve) {
      curve = await this.promptForCurve()
    }

    // Generate account/workspace keys.
    cli.action.start(chalk.green('Generating account keys'))
    const keys = await generateAccountConfigurationKeys({
      email,
      name,
      curve,
      passphrase,
    })
    cli.action.stop('✅')

    // Configure account.
    cli.action.start(chalk.green('Configuring account - this may take a few seconds'))

    // Artificially wait 5 seconds to ensure the API key is active,
    // otherwise the `configureAccount` call may fail with a 403.
    await cli.wait(2_500)

    await api.configureAccount({
      AccountName: name,
      AccountEncryptionKeySalt: keys.accountKeyPair.encryptionKeySalt,
      AccountPublicKey: keys.accountKeyPair.publicKey,
      AccountEncryptedPrivateKey: keys.accountKeyPair.encryptedPrivateKey,
      PersonalWorkspacePublicKey: keys.personalWorkspaceKeyPair.publicKey,
      PersonalWorkspaceEncryptedPrivateKey: keys.personalWorkspaceKeyPair.encryptedPrivateKey,
    }, {
      ApiKey,
    })
    cli.action.stop('✅')

    const userConfig: UserConfig = {
      Device: {
        Name: deviceName,
        ApiKey,
      },
      Account: {
        Id: AccountId,
        Email: email,
        PublicKey: keys.accountKeyPair.publicKey,
        EncryptedPrivateKey: keys.accountKeyPair.encryptedPrivateKey,
        EncryptionKeySalt: keys.accountKeyPair.encryptionKeySalt,
      },
      PersonalWorkspace: {
        Id: PersonalWorkspaceId,
        PublicKey: keys.personalWorkspaceKeyPair.publicKey,
        EncryptedPrivateKey: keys.personalWorkspaceKeyPair.encryptedPrivateKey,
      },
    }

    await config.write(
      userConfig,
      this.config.configDir,
      profile
    )

    this.goodbye()
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

  private goodbye(): never {
    this.log(chalk.reset(`
Configuration written to ${chalk.yellow(this.config.configDir)}.

Let's try adding a new snip:

    ${chalk.bold('$ snip add "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" --name "satoshi"')}
`))

    // Exit cleanly.
    this.exit(100)
  }

  private async welcomeUser(): Promise<void> {
    const createImage = promisify(Image.create)

    const welcomeAsciiText = await createImage({
      filepath: 'sniptt-logo.png',
      width: 40,
      lineart: true,
    })

    this.log('\n' + welcomeAsciiText + '\n')
  }

  private userConfigFound(profile: string): never {
    this.log(`${chalk.reset(`The profile ${chalk.bold.magenta(profile)} is already configured! 👌`)}

If you would like to configure a new profile, run the following:

    ${chalk.bold(`$ snip configure --profile ${chalk.magenta('new_profile_name')}`)}
`)

    // Exit cleanly.
    this.exit(100)
  }

  private async promptForAccountName(): Promise<string> {
    const accountNameSchema = yup.string().min(1).max(64).required()

    const {accountName} = await prompt<{ accountName: string }>({
      type: 'input',
      name: 'accountName',
      message: chalk.bold('What should we name your Sniptt account?'),
      required: true,
      initial: generateName(),
      validate: async value => {
        try {
          await accountNameSchema.validate(value)
          return true
        } catch (error) {
          return error.message
        }
      },
    })

    return accountName
  }

  private async promptForEmail(): Promise<string> {
    const accountEmailSchema = yup.string().email().required()

    const {accountEmail} = await prompt<{ accountEmail: string }>({
      type: 'input',
      name: 'accountEmail',
      message: chalk.bold('What email address should we use to verify your identity?'),
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

  private async promptForOtp({email}: { email: string }): Promise<string> {
    const otpSchema = yup.string().length(8).required()

    const {otp} = await prompt<{ otp: string }>({
      type: 'password',
      name: 'otp',
      message: chalk.bold(`Please enter the verification code sent to ${chalk.cyan(email)}`),
      required: true,
      validate: async value => {
        try {
          await otpSchema.validate(value)
          return true
        } catch (error) {
          return error.message
        }
      },
    })

    return otp
  }

  private async promptForPassphrase(): Promise<string> {
    const accountPassphraseSchema = yup.string().min(12).max(256).required()

    const {accountPassphrase} = await prompt<{ accountPassphrase: string }>({
      type: 'password',
      name: 'accountPassphrase',
      message: chalk.bold(`What passphrase would you like to use to encrypt your master key? ${chalk.cyan('(12 characters or more)')}`),
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

  private async promptForConfirmPassphrase({passphrase}: { passphrase: string }): Promise<string> {
    const {confirmAccountPassphrase} = await prompt<{ confirmAccountPassphrase: string }>({
      type: 'password',
      name: 'confirmAccountPassphrase',
      message: chalk.bold('Please confirm passphrase'),
      required: true,
      validate: value => {
        if (value === passphrase) {
          return true
        }

        return 'passphrase does not match'
      },
    })

    return confirmAccountPassphrase
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
