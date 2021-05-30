#!/usr/bin/env node

import { RequestError } from 'got';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
  .commandDir('commands')
  .demandCommand()
  .help()
  .fail((message, error) => {
    if (message) {
      process.stderr.write(message);
      process.exit(1);
    }

    if (error instanceof RequestError) {
      const errorDetails = error.response?.body;
      process.stderr.write(
        typeof errorDetails === 'string'
          ? errorDetails
          : 'unknown error occurred',
      );
      process.exit(1);
    }

    console.error(error);
    process.exit(1);
  })
  .showHelpOnFail(false, 'Specify --help for available options').argv;
