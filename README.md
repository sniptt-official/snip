sniptt
==========

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sniptt.svg)](https://npmjs.org/package/sniptt)
[![Downloads/week](https://img.shields.io/npm/dw/sniptt.svg)](https://npmjs.org/package/sniptt)
[![License](https://img.shields.io/npm/l/sniptt.svg)](https://github.com/e2e-tech/cli/blob/master/package.json)

<!-- toc -->
* [Project overview](#project-overview)
* [FAQs](#faqs)
* [Roadmap to v1.0](#roadmap-to-v10)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Project overview

Secure content management with end-to-end encryption.

## Important information for users

This is an early-stage project and as such only provides low-level functionality and APIs at present. Please note the APIs might change before reaching v1.0.

## Basic usage

First, create an account. This will also generate a set of ECC encryption keys associated with your account.

```sh
Alice$ sniptt create-account --email "alice@example.com" --name "Alice's personal 👩‍💻" --passphrase "numbingrelatableliquefy"
```

A verification email will be sent to the provided email address. Once you've verified your email, you can start using e2e to manage content securely.

```sh
Alice$ sniptt create --from-file "credentials.csv" --passphrase "numbingrelatableliquefy"
{"MessageId":"BhY0TShLng","MessageStatus":"Creating"}
```

You can then read your message.

```sh
Alice$ sniptt read BhY0TShLng --passphrase "numbingrelatableliquefy"
```

To list all messages for your account, use the following command.

```sh
Alice$ sniptt messages
```

You can share messages with other accounts.

```sh
Alice$ sniptt share BhY0TShLng --email "bob@example.com" --name "🕵️‍♂️" --passphrase "numbingrelatableliquefy"
{"MessageGrantId":"JjqKaUpwS0"}
```

The nominated account will receive an email notification that read access has been granted to your message.

They will be able to read your message using the `--grant` option.

```sh
Bob$ sniptt read BhY0TShLng --grant
```

Users can view all their grants using the following command.

```sh
Bob$ sniptt grants
```

# FAQs

## Why are there account limits in place?

Compute and storage cost money, therefore the most sensible thing to do at the moment is to make sure these costs can be covered when usage exceeds certain parameters.

Currently, users are able to create 10 messages per month and share each message with 1 additional user for free.

Additionally, we offer 2 paid tiers for users who wish to upgrade:

### 1. Personal tier

- 30 messages per month
- 3 grants per message
- Ability to delete messages

Cost: ~ 1 ☕️ per month (please contact support@e2e.sh to subscribe)

### 2. Team tier

- 100 messages per month
- 5 grants per message
- Ability to delete messages
- Ability to set auto-expiry on messages

Cost: ~ 3 ☕️ per month (please contact support@e2e.sh to subscribe)

Please note that there are additional restrictions (rate-limiting and daily request quotas) in place for each user and upgrading to a paid tier does not remove or update them.

## Why do I need to provide my email?

Your email address is used for account-related transactional email only.

We currently use email to verify customers' accounts, and to notify customers of account-related activity such as obtaining access rights to a message.

The only 3rd party we share your email address with is Stripe, however this only applies in the case that you decide to upgrade your account to a paid tier.

## Why are my requests sometimes taking longer than expected?

There may be 2 reasons for this:

1. Currently the API is only deployed in eu-west-2 (London) therefore some users will likely experience longer than usual response times; and
2. The platform is mostly serverless therefore some users might occasionally experience cold starts resulting in longer than usual response times (e.g. ~1 second).

# Roadmap to v1.0

Currently, there is an in-progress quick-and-dirty GitHub project to help track progress against a stable v1.0 release.

See https://github.com/e2e-tech/cli/projects/1 for more details.

# Usage
<!-- usage -->
```sh-session
$ npm install -g sniptt
$ sniptt COMMAND
running command...
$ sniptt (-v|--version|version)
sniptt/0.0.22 darwin-x64 node-v14.15.4
$ sniptt --help [COMMAND]
USAGE
  $ sniptt COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sniptt add [VALUE]`](#sniptt-add-value)
* [`sniptt configure`](#sniptt-configure)
* [`sniptt get [NAME]`](#sniptt-get-name)
* [`sniptt help [COMMAND]`](#sniptt-help-command)
* [`sniptt workspace:addMember`](#sniptt-workspaceaddmember)
* [`sniptt workspace:create [NAME]`](#sniptt-workspacecreate-name)

## `sniptt add [VALUE]`

Add encrypted Snip to a workspace

```
USAGE
  $ sniptt add [VALUE]

OPTIONS
  -h, --help                   show CLI help
  -n, --name=name              secret name
  -p, --passphrase=passphrase  master passphrase used to protect your account key
  -w, --workspace=workspace    name of workspace to store secret
  --profile=profile            [default: default] account profile to use

EXAMPLES
  $ snippt add "super secret" --name "satoshi"
  $ snippt add "super secret" --name "satoshi" --workspace "devs"
```

_See code: [src/commands/add.ts](https://github.com/sniptt-official/cli/blob/v0.0.22/src/commands/add.ts)_

## `sniptt configure`

Configure Sniptt

```
USAGE
  $ sniptt configure

OPTIONS
  -c, --curve=(curve25519|ed25519|p256|p384|p521|brainpoolP256r1|brainpoolP384r1|brainpoolP512r1|secp256k1)
      ecc curve name used to generate account keys

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

_See code: [src/commands/configure.ts](https://github.com/sniptt-official/cli/blob/v0.0.22/src/commands/configure.ts)_

## `sniptt get [NAME]`

Get encrypted Snip from a workspace

```
USAGE
  $ sniptt get [NAME]

OPTIONS
  -h, --help                   show CLI help
  -p, --passphrase=passphrase  master passphrase used to protect your account key
  -w, --workspace=workspace    workspace name
  --profile=profile            [default: default] account profile to use

EXAMPLES
  $ snip get "satoshi"
  $ snip get "satoshi" --workspace "devs"
```

_See code: [src/commands/get.ts](https://github.com/sniptt-official/cli/blob/v0.0.22/src/commands/get.ts)_

## `sniptt help [COMMAND]`

display help for sniptt

```
USAGE
  $ sniptt help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `sniptt workspace:addMember`

Add member to Sniptt workspace

```
USAGE
  $ sniptt workspace:addMember

OPTIONS
  -e, --email=email            email of account to invite
  -h, --help                   show CLI help
  -p, --passphrase=passphrase  master passphrase used to protect your account key
  -w, --workspace=workspace    workspace name
  --profile=profile            [default: default] account profile to use

EXAMPLE
  $ snip workspace:add-member -e "bob@example.com" -w "devs"
```

_See code: [src/commands/workspace/addMember.ts](https://github.com/sniptt-official/cli/blob/v0.0.22/src/commands/workspace/addMember.ts)_

## `sniptt workspace:create [NAME]`

Create new Sniptt workspace

```
USAGE
  $ sniptt workspace:create [NAME]

OPTIONS
  -c, --curve=(curve25519|ed25519|p256|p384|p521|brainpoolP256r1|brainpoolP384r1|brainpoolP512r1|secp256k1)  ecc curve
                                                                                                             name used
                                                                                                             to generate
                                                                                                             workspace
                                                                                                             keys

  -h, --help                                                                                                 show CLI
                                                                                                             help

  --profile=profile                                                                                          [default:
                                                                                                             default]
                                                                                                             account
                                                                                                             profile to
                                                                                                             use

EXAMPLES
  $ snip workspace:create
  $ snip workspace:create "devs"
```

_See code: [src/commands/workspace/create.ts](https://github.com/sniptt-official/cli/blob/v0.0.22/src/commands/workspace/create.ts)_
<!-- commandsstop -->
