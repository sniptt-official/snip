#!/usr/bin/env node

import chalk from 'chalk';
import { RequestError } from 'got';
import { EOL } from 'os';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// .showHelpOnFail(false, 'Specify --help for available options')
yargs(hideBin(process.argv))
  .commandDir('commands')
  .command(
    '$0',
    'Sniptt CLI usage',
    () => {},
    () => {
      yargs.showHelp();
    },
  )
  .help('h')
  .alias('h', 'help')
  .fail((message, error) => {
    if (message) {
      process.stderr.write(chalk.red(message) + EOL);
      process.exit(1);
    }

    let errorMessage =
      'Unknown error occurred, please contact support@sniptt.com';

    if (error instanceof RequestError) {
      const errorDetails = error.response?.body;

      if (typeof errorDetails === 'string') {
        errorMessage = errorDetails;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    process.stderr.write(chalk.red(errorMessage) + EOL);
    process.exit(1);
  }).argv;
