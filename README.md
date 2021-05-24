sniptt
==========

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sniptt.svg)](https://npmjs.org/package/sniptt)
[![Downloads/week](https://img.shields.io/npm/dw/sniptt.svg)](https://npmjs.org/package/sniptt)
[![License](https://img.shields.io/npm/l/sniptt.svg)](https://github.com/e2e-tech/cli/blob/master/package.json)

<!-- toc -->
* [Project overview](#project-overview)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Project overview

The secret manager that developers love.

# Usage
<!-- usage -->
```sh-session
$ npm install -g sniptt
$ snip COMMAND
running command...
$ snip (-v|--version|version)
sniptt/0.0.27 darwin-x64 node-v14.15.4
$ snip --help [COMMAND]
USAGE
  $ snip COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`snip add [NAME] [VALUE]`](#snip-add-name-value)
* [`snip configure`](#snip-configure)
* [`snip get [NAME]`](#snip-get-name)
* [`snip help [COMMAND]`](#snip-help-command)
* [`snip ls`](#snip-ls)
* [`snip share [NAME]`](#snip-share-name)
* [`snip workspace ACTION [NAME]`](#snip-workspace-action-name)

## `snip add [NAME] [VALUE]`

Add encrypted Snip to a workspace

```
USAGE
  $ snip add [NAME] [VALUE]

OPTIONS
  -f, --file=file              file to use as input
  -h, --help                   show CLI help
  -p, --passphrase=passphrase  master passphrase used to protect your account key
  -w, --workspace=workspace    name of workspace to store secret
  --profile=profile            [default: default] account profile to use

EXAMPLES
  $ snip add DB_PASSWORD AYYGR3h64tHp9Bne
  $ snip add "local dev env" --file .env.local --workspace devs
  $ snip add --file .env.prod --workspace phoenix:automation
```

_See code: [src/commands/add.ts](https://github.com/sniptt-official/cli/blob/v0.0.27/src/commands/add.ts)_

## `snip configure`

Configure Sniptt

```
USAGE
  $ snip configure

OPTIONS
  -c, --curve=(curve25519|ed25519|p256|p384|p521|brainpoolP256r1|brainpoolP384r1|brainpoolP512r1|secp256k1)
      [default: curve25519] ecc curve name used to generate account keys

  -e, --email=email
      email associated with the account

  -n, --name=name
      name associated with the account

  -p, --passphrase=passphrase
      master passphrase used to protect your account key

  --profile=profile
      [default: default] namespace to associate this account configuration with

EXAMPLES
  $ snip configure --email "alice@example.com"
  $ snip configure --email "alice@example.com" --name "Alice personal 👩‍💻" --passphrase "numbingrelatableliquefy"
  $ snip configure --email "alice@example.com" --curve "brainpoolP256r1" --profile "personal"
```

_See code: [src/commands/configure.ts](https://github.com/sniptt-official/cli/blob/v0.0.27/src/commands/configure.ts)_

## `snip get [NAME]`

Get encrypted Snip from a workspace

```
USAGE
  $ snip get [NAME]

OPTIONS
  -h, --help                   show CLI help
  -o, --out=out                output result to a file
  -p, --passphrase=passphrase  master passphrase used to protect your account key
  -w, --workspace=workspace    workspace name
  --profile=profile            [default: default] account profile to use
  --stdout                     pipe result directly to stdout, useful for scripting

EXAMPLES
  $ snip get DB_PASSWORD
  $ snip get DB_PASSWORD --workspace devs
  $ snip get "local dev env" --stdout | pbcopy
  $ snip get .env.prod --workspace phoenix:automation -o .env.prod
```

_See code: [src/commands/get.ts](https://github.com/sniptt-official/cli/blob/v0.0.27/src/commands/get.ts)_

## `snip help [COMMAND]`

display help for snip

```
USAGE
  $ snip help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `snip ls`

List secrets in a workspace

```
USAGE
  $ snip ls

OPTIONS
  -h, --help                 show CLI help
  -w, --workspace=workspace  workspace name
  -x, --extended             show extra columns
  --columns=columns          only show provided columns (comma-separated)
  --csv                      output is csv format [alias: --output=csv]
  --filter=filter            filter property by partial string matching, ex: name=foo
  --no-header                hide table header from output
  --no-truncate              do not truncate output to fit screen
  --output=csv|json|yaml     output in a more machine friendly format
  --profile=profile          [default: default] account profile to use
  --sort=sort                property to sort by (prepend '-' for descending)

EXAMPLES
  $ snip ls
  $ snip ls --workspace devs
```

_See code: [src/commands/ls.ts](https://github.com/sniptt-official/cli/blob/v0.0.27/src/commands/ls.ts)_

## `snip share [NAME]`

Share an encrypted Snip via one-time URL

```
USAGE
  $ snip share [NAME]

OPTIONS
  -h, --help                   show CLI help
  -p, --passphrase=passphrase  master passphrase used to protect your account key
  --profile=profile            [default: default] account profile to use

EXAMPLE
  $ snip share DB_PASSWORD
```

_See code: [src/commands/share.ts](https://github.com/sniptt-official/cli/blob/v0.0.27/src/commands/share.ts)_

## `snip workspace ACTION [NAME]`

Manage workspaces

```
USAGE
  $ snip workspace ACTION [NAME]

OPTIONS
  -c, --curve=(curve25519|ed25519|p256|p384|p521|brainpoolP256r1|brainpoolP384r1|brainpoolP512r1|secp256k1)
      [default: curve25519] ecc curve name used to generate workspace keys

  -e, --email=email
      email of account to invite

  -h, --help
      show CLI help

  -p, --passphrase=passphrase
      master passphrase used to protect your account key

  -x, --extended
      show extra columns

  --columns=columns
      only show provided columns (comma-separated)

  --csv
      output is csv format [alias: --output=csv]

  --filter=filter
      filter property by partial string matching, ex: name=foo

  --no-header
      hide table header from output

  --no-truncate
      do not truncate output to fit screen

  --output=csv|json|yaml
      output in a more machine friendly format

  --profile=profile
      [default: default] account profile to use

  --sort=sort
      property to sort by (prepend '-' for descending)

EXAMPLES
  $ snip workspace ls
  $ snip workspace create
  $ snip workspace create devs
  $ snip workspace add-member devs -e bob@example.com
  $ snip workspace list-members devs
```

_See code: [src/commands/workspace.ts](https://github.com/sniptt-official/cli/blob/v0.0.27/src/commands/workspace.ts)_
<!-- commandsstop -->
