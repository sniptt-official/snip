import {Command, flags} from '@oclif/command'
import * as chalk from 'chalk'
import {cli} from 'cli-ux'
import {prompt} from 'enquirer'
import api from '../services/api'
import ApiError from '../services/api/error'
import config from '../services/config'

export default class LsSnipCommand extends Command {
  static description = 'List secrets in a workspace';

  static flags = {
    help: flags.help({char: 'h'}),
    workspace: flags.string({
      char: 'w',
      description: 'workspace name',
    }),
    profile: flags.string({
      description: 'account profile to use',
      default: 'default',
    }),
    ...cli.table.flags(),
  };

  static examples = [
    '$ snip ls',
    '$ snip ls --workspace devs',
  ];

  async run() {
    const {flags: {profile, workspace, ...tableFlags}} = this.parse(LsSnipCommand)
    let workspaceName = workspace

    const userConfig = await config.read(this.config.configDir, profile)

    if (!userConfig) {
      throw new Error('missing user configuration')
    }

    // 1. Determine which workspace to retrive the secret from.
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

    // 2. List secrets.
    cli.action.start(chalk.green('Fetching secrets'))
    const secrets = await api.listSecrets({WorkspaceId: workspaceId}, {ApiKey: userConfig.Device.ApiKey})
    cli.action.stop('✅')

    // 3. Print secrets as a table.
    cli.table(secrets, {
      SecretId: {
        header: 'SecretId',
        get: row => row.SecretId,
        extended: true,
      },
      SecretName: {
        header: 'SecretName',
        get: row => row.SecretName,
      },
      SecretOwnerDisplayName: {
        header: 'SecretOwnerDisplayName',
        get: row => `${row.AccountName} <${row.AccountEmail}>`,
      },
      SecretOwnerAccountId: {
        header: 'SecretOwnerAccountId',
        get: row => row.AccountId,
        extended: true,
      },
      SecretOwnerAccountName: {
        header: 'SecretOwnerAccountName',
        get: row => row.AccountName,
        extended: true,
      },
      SecretOwnerAccountEmail: {
        header: 'SecretOwnerAccountEmail',
        get: row => row.AccountEmail,
        extended: true,
      },
    }, {
      printLine: this.log,
      ...tableFlags, // parsed flags
    })
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
}
