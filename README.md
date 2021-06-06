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
*   [Features](#features)
*   [Basic Usage](#basic-usage)
    *   [Setup](#setup)
    *   [Add secrets](#add-secrets)
    *   [Read secrets](#read-secrets)
    *   [Vaults](#vaults)
    *   [Sharing](#sharing)
*   [Usage Limits](#usage-limits)
*   [FAQ](#faq)
    *   [Who can access my secrets?](#who-can-access-my-secrets)
*   [Manual install](#manual-install)
    *   [macOS manual install](#macos-manual-install)
        *   [Uninstall](#uninstall)
    *   [Linux manual install](#linux-manual-install)
        *   [Uninstall](#uninstall-1)
*   [License](#license)

## Introduction

<img src="https://www.sniptt.com/img/terminal/vault-example.gif" alt="Vault example" />

Sniptt is a secret manager for developers.

The main purpose of Sniptt is to simplify and improve the experience of sharing secrets and credentials between developers and machines.

You can finally say goodbye to 1Password, LastPass, and Dashlane 👋.

## Install

```sh
$ brew install sniptt-official/snip/snip
```

See manual installation instructions for [macOS](#macos-manual-install) and [Linux](#linux-manual-install).

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

## Usage Limits

Sniptt is **free to use** for personal use with the following limits:

*   Up to 100 secrets per month
*   Up to 100 URL shares per month
*   1 additional Vault (up to 3 members)

To increase limits and access more features, please email us at support@sniptt.com.

## FAQ

### Who can access my secrets?

**You and only you can access your secrets stored privately with Sniptt.** The Master Password used to encrypt your private key **never leaves your device**, ensuring nobody, not even Sniptt has access to your encrypted data. You can even verify the code to make sure! 🕵️‍♂️

If you wish to share your secrets with others, then you will need to create a shared Vault or use the one-time-secret functionality to do so.

## Manual install

### macOS manual install

1.  Download the tarball using the `curl` command. The `-o` option specifies the file name that the downloaded tarball is written to. In this example, the file is written to `snip.tar.gz` in the current folder.

```sh
$ curl -L https://github.com/sniptt-official/snip-cli/releases/download/v0.0.39/snip-macos-x64.tar.gz -o snip.tar.gz
```

NOTE: You can install to any folder, or choose the recommended `/usr/local/snip-cli`.

To verify the integrity of the tarball, run the following command and check that the output matches the one on the relevant [release page](https://github.com/sniptt-official/snip-cli/releases/tag/v0.0.39).

```sh
$ sha256sum snip.tar.gz
```

2.  Extract the binary.

```sh
$ tar -xf snip.tar.gz
```

3.  Create a symlink to the user's `bin` folder.

```sh
$ sudo ln -sf snip /usr/local/bin/snip
```

NOTE: You must have write permissions to the specified folder. Creating a symlink to a folder that is already in your path eliminates the need to add the install folder to the user's `$PATH` variable.

4.  Verify the installation.

Assuming `/usr/local/bin` is on your `PATH`, you can now run:

```sh
$ snip --version
```

#### Uninstall

1.  Find the folder that contains the symlink to the main binary.

```sh
$ which snip
/usr/local/bin/snip
```

2.  Using that information, run the following command to find the installation folder that the symlink points to.

```sh
$ ls -l /usr/local/bin/snip
lrwxr-xr-x  1 user  admin  4  4 Jun 16:20 /usr/local/bin/snip -> /folder/installed/snip-cli/snip
```

3.  Delete the symlink in the first folder. If your user account already has write permission to this folder, you don't need to use `sudo`.

```sh
$ sudo rm /usr/local/bin/snip
```

4.  Delete the main installation folder.

```sh
$ rm -rf /folder/installed/snip-cli
```

### Linux manual install

1.  Download the tarball using the `curl` command. The `-o` option specifies the file name that the downloaded tarball is written to. In this example, the file is written to `snip.tar.gz` in the current directory.

```sh
$ curl -L https://github.com/sniptt-official/snip-cli/releases/download/v0.0.39/snip-linux-x64.tar.gz -o snip.tar.gz
```

NOTE: You can install to any directory, or choose the recommended `/usr/local/snip-cli`.

To verify the integrity of the tarball, run the following command and check that the output matches the one on the relevant [release page](https://github.com/sniptt-official/snip-cli/releases/tag/v0.0.39).

```sh
$ shasum -a 256 snip.tar.gz
```

2.  Extract the binary.

```sh
$ tar -xf snip.tar.gz
```

3.  Create a symlink to the user's `bin` directory.

```sh
$ sudo ln -sf snip /usr/local/bin/snip
```

NOTE: You must have write permissions to the specified directory. Creating a symlink to a directory that is already in your path eliminates the need to add the install directory to the user's `$PATH` variable.

4.  Verify the installation.

Assuming `/usr/local/bin` is on your `PATH`, you can now run:

```sh
$ snip --version
```

#### Uninstall

1.  Find the directory that contains the symlink to the main binary.

```sh
$ which snip
/usr/local/bin/snip
```

2.  Using that information, run the following command to find the installation directory that the symlink points to.

```sh
$ ls -l /usr/local/bin/snip
lrwxr-xr-x  1 user  admin  4  4 Jun 16:20 /usr/local/bin/snip -> /directory/installed/snip-cli/snip
```

3.  Delete the symlink in the first directory. If your user account already has write permission to this directory, you don't need to use `sudo`.

```sh
$ sudo rm /usr/local/bin/snip
```

4.  Delete the main installation directory.

```sh
$ rm -rf /directory/installed/snip-cli
```

## License

This project is under the MIT license.
