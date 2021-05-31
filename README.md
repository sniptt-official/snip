<p align="center" style="text-align:center;">
  <a href="https://sniptt.com">
    <img src="./assets/readme-hero-logo.svg" alt="Sniptt Logo" 🔐/>
  </a>
</p>

<div align="center">
 🔐 The secret manager that developers love!
</div>

<br />

<div align="center">
  <!-- NPM version -->
  <a href="https://npmjs.org/package/sniptt">
    <img src="https://img.shields.io/npm/v/sniptt.svg?style=flat-square" alt="NPM version" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/sniptt">
    <img src="https://img.shields.io/npm/dt/sniptt.svg?style=flat-square"
      alt="Download" />
  </a>
  <!-- License -->
  <a href="https://github.com/e2e-tech/cli/blob/master/package.json">
    <img src="https://img.shields.io/npm/l/sniptt.svg?style=flat-square" alt="License" />
  </a>
</div>

---
## Table of Contents
1. [Install](#install)
2. [Introduction](#introduction)
3. [Basic Usage](#basic-usage)
4. [FAQ](#faq)
5. [License](#license)

## Install
Install with npm:
```sh
npm i sniptt -g
```
Install with yarn:
```sh
yarn global add sniptt
```

## Introduction

Sniptt is a developer-friendly Secret Manager. The main purpose of Sniptt is to simplify and improve the experience of sharing secrets between developers and systems.

- __🔐 End-to-End Encryption:__ Secrets are encrypted using `OpenPGP`, the most widely used email encryption standard.
- __👾 CLI Powered Developer Experience:__ Protect and share secrets directly from your terminal or favourite IDE (coming soon).
- __🔗 Built on Blockchain:__ Stay comforted knowing that every secret has a complete and verifiable history of changes over time.
- __♻️ Serverless:__ We are 100% serverless!

## Basic Usage

### Setup
Create a new account or configure a new device.

```sh
snip configure
```

### Add Secret
Add an encrypted secret to your vault.

```sh
# Add simple key/value.
snip add DB_PASSWORD AYYGR3h64tHp9Bne

# Add simple key/value to Vault.
snip add DB_PASSWORD AYYGR3h64tHp9Bne --vault phoenix:automation

# Add file.
snip add --file .env.prod

# Add file to Vault.
snip add --file .env.prod --vault phoenix:automation
```

### View Secret
Read encrypted secrets from a Vault.

```sh
# Read from your default personal Vault.
snip get DB_PASSWORD

# Read from a different Vault.
snip get DB_PASSWORD --vault phoenix:automation
```

### Vaults
Vaults allow you to store and share secrets with others.

```sh
# List available Vaults.
snip vault ls

# Create a new Vault.
snip vault create

# Add a member to a Vault.
snip vault add-member devs -e bob@example.com

# Remove member from a Vault.
snip vault remove-member devs -e bob@example.com

# List Vault members.
snip vault list-members devs
```

### Sharing

Share an encrypted Snip via a one-time URL.

```sh
# Create one-time secret.
snip share AYYGR3h64tHp9Bne

# Create one-time secret from a file.
snip share --file .env.local
```

## Usage Limits

Sniptt is **free to use** for personal use with the following limits:

 - Up to 100 secrets secrets per month
 - Up to 100 URL shares per month
 - 1 additional Vault (up to 3 members)

To increase limits and access more features, please see our [pricing plans](https://www.sniptt.com/pricing/).


## FAQ

### Who can access my secrets?
**You and only you can access your secrets stored privately with Sniptt.** The Master Password used to encrypt your private key **never leaves your device**, ensuring nobody, not even Sniptt has access to your encrypted data. You can even verify the code to make sure! :)

If you wish to share your secrets with others, then you will need to create a shared Vault to do so.

## License

This project is under the MIT license.
