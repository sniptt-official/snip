import chalk from 'chalk';
import { RequestError } from 'got';
import { EOL } from 'os';

const printMessage = (message: string) => {
  process.stderr.write(chalk.red(`Error: ${message}`) + EOL);
  process.stderr.write(
    `Hint: Use the ${chalk.green(
      '--help',
    )} option to get help about the usage` + EOL,
  );
};

export default (message: string, error: Error): never => {
  if (message) {
    printMessage(message);
    process.exit(1);
  }

  let errorMessage = 'Unknown error occurred';

  if (error instanceof RequestError) {
    const errorDetails = error.response?.body;

    if (typeof errorDetails === 'string') {
      errorMessage = errorDetails;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  printMessage(errorMessage);
  process.exit(1);
};
