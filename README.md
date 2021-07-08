<p align="center" style="text-align:center;">
  <a href="https://sniptt.com">
    <img src="./assets/readme-hero-logo.svg" alt="Sniptt Logo" />
  </a>
</p>

<div align="center">
 🔐 The secret manager that developers love!
</div>

***

<div align="center">
  <b>Please note that this project is under active development. APIs might change before version 1 is released.</b>
</div>

## Table of Contents

*   [Introduction](#introduction)
*   [Install](#install)
    *   [Homebrew](#homebrew)
    *   [npm](#npm)
    *   [Manual](#manual)
*   [Features](#features)
*   [Basic Usage](#basic-usage)
    *   [Setup](#setup)
    *   [Add secrets](#add-secrets)
    *   [Read secrets](#read-secrets)
    *   [Vaults](#vaults)
    *   [Sharing](#sharing)
*   [FAQ](#faq)
    *   [Is Snippt free?](#is-snippt-free)
    *   [Who can access my secrets?](#who-can-access-my-secrets)
    *   [Why does it sometimes take longer to fulfill a request?](#why-does-it-sometimes-take-longer-to-fulfill-a-request)
*   [License](#license)

## Introduction

<img src="https://www.sniptt.com/img/terminal/vault-example.gif" alt="Vault example" />

Sniptt is a secret manager for developers.

The main purpose of Sniptt is to simplify and improve the experience of sharing secrets and credentials between developers and machines.

You can finally say goodbye to 1Password, LastPass, and Dashlane 👋.

## Install

### Homebrew

The recommended way to install `snip` on macOS is via Homebrew.

```sh
$ brew install sniptt-official/snip/snip
```

#### Update

To update to latest version of `snip`, use:

```sh
brew upgrade sniptt-official/snip/snip
```

If you're using macOS Keychain to store the master passphrase, you might need to grant `snip` access to the **Sniptt Safe Storage** item by clicking "Always Allow".

### npm

Alternatively, you can also install `snip` via npm.

```sh
npm install sniptt -g
```

### Manual

For manual installation instructions on macOS and Linux, please refer to the dedicated [install docs](./docs/manual-install.md).

## Features

*   **🔐 End-to-end encryption:** Secrets are encrypted using [OpenPGP](https://www.openpgp.org/), the most widely used messaging encryption standard.
*   **👾 For developers, by developers:** Protect and share secrets directly from your terminal.
*   **🔗 Immutable and cryptographically verifiable (coming soon):** Stay comforted knowing that every secret has a complete and verifiable history of changes over time. Powered by [Amazon QLDB](https://aws.amazon.com/qldb/).

## Basic Usage

### Setup

Create a new account or configure a new device with an existing account.

```sh
$ snip configure
```

For advanced usage, type `$ snip configure -h`.

### Add secrets

Add end-to-end encrypted secrets to your personal vault.

```sh
# Add simple key/value.
$ snip add DB_PASSWORD AYYGR3h64tHp9Bne

# Add simple key/value (you will be prompted using hidden password input).
$ snip add DB_PASSWORD

# Add file.
$ snip add --file .env.prod
```

For advanced usage, type `$ snip add -h`.

### Read secrets

Read end-to-end encrypted secrets from your personal vault.

```sh
# Read simple value.
$ snip get DB_PASSWORD

# Read a file.
$ snip get .env.prod

# Download a file.
$ snip get .env.prod -o .env.prod

# Get started with automation.
$ snip get .env.prod -q --json | jq -r .SecretContent | base64 -d
```

For advanced usage, type `$ snip get -h`.

### Vaults

Vaults allow you to store and share secrets with others.

```sh
# Create a new vault.
$ snip vault create creds:aws

# Add a member to a vault.
$ snip vault add-member creds:aws -e alice@example.com

# Add a secret to a vault.
$ snip add -f sandbox.csv -v creds:aws

# Automate workflows.
$ snip vault ls -q --json | jq -r ".[].VaultId" | pbcopy
```

For advanced usage, type `$ snip vault -h`.

### Sharing

Share an end-to-end encrypted secret via a one-time URL.

```sh
# Create one-time secret.
$ snip share AYYGR3h64tHp9Bne

# Create one-time secret from a file.
$ snip share --file .env.local
```

For advanced usage, type `$ snip share -h`.

## FAQ

### Is Snippt free?

Sniptt is **free** for personal use with the following limits:

*   Up to 100 secrets per month
*   Up to 100 URL shares per month
*   1 additional Vault (up to 3 members)

To increase limits and access more features, please email us at <support@sniptt.com>.

### Who can access my secrets?

**You and only you can access your secrets stored privately with Sniptt.** The Master Password used to encrypt your private key **never leaves your device**, ensuring nobody, not even Sniptt has access to your encrypted data. You can even verify the code to make sure! 🕵️‍♂️

If you wish to share your secrets with others, then you will need to create a shared Vault or use the one-time-secret functionality to do so.

### Why does it sometimes take longer to fulfill a request?

Our platform is built on AWS, using 100% serverless architecture. We rely heavily on Lambda, so you may occasionally experience what's called a "cold start". Another reason your requests might be taking slightly longer is if you're not in Europe. We're currently only deployed in eu-west-1 (Ireland), however we plan to deploy in 2 additional regions soon.

## License

This project is under the MIT license.
