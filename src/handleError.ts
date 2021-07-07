import chalk from 'chalk';
import { EOL } from 'os';

const printMessage = (message: string) => {
  process.stderr.write(chalk.red(`Error: ${message}`) + EOL);
  process.stderr.write(
    `Hint: Use the ${chalk.green(
      '--help',
    )} option to get help about the usage` + EOL,
  );
};

export default async (message: string, error: Error): Promise<never> => {
  if (message) {
    printMessage(message);
    process.exit(1);
  }

  let errorMessage = 'Unknown error occurred';

  if (error instanceof Response) {
    const { ErrorMessage } = await error.json();

    if (ErrorMessage) {
      errorMessage = ErrorMessage;
    }
  } else {
    errorMessage = error.message;
  }

  printMessage(errorMessage);
  process.exit(1);
};
