import chalk from 'chalk';

export const welcome = () => {
  const welcomeAsciiText = Buffer.from(
    'ICAgICAgICAgICAgICAgIOKWhOKWhCAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgIOKWgOKWgCAgICAgICAgICAgIOKWn+KWiCAgIOKWl+KWiOKWjCAgCiDiloTilp/ilpviloDilowg4paI4paI4paZ4paf4paI4paI4paEICDilojiloggIOKWnuKWiOKWmeKWhOKWiOKWiOKWhOKWluKWneKWiOKWiOKWiOKWgOKWmOKWnOKWiOKWiOKWm+KWgCAKIOKWgOKWiOKWiOKWmeKWhCDilojilojilpsgIOKWiOKWiOKWjCDilojiloggIOKWnuKWiOKWiCAg4pae4paI4paIIOKWnuKWiOKWiCAgIOKWiOKWiOKWjCAgCiDilpfiloTiloTilojilpsg4paI4paI4paMICDilojilojilowg4pac4paI4paI4paM4pae4paI4paI4pac4paI4paI4pab4paYIOKWneKWiOKWiOKWiOKWjCDilpzilojilojilpkgCiAgICAgICAgICAgICAgICAgICAg4pae4paI4pabICAgICAgICAgICAgICAgICA=',
    'base64',
  );

  process.stdout.write(`
${welcomeAsciiText}

Welcome to Sniptt.

Sharing secrets with password managers is slow and expensive.

Instead, share and read secrets without leaving your terminal or IDE.

`);
};

export const userConfigFound = (profile: string) => {
  process.stdout.write(`
The profile ${chalk.cyan(profile)} is already configured! 👌

If you would like to configure a new profile, run the following:

    ${chalk.bold(
      `$ snip configure --profile ${chalk.cyan('new_profile_name')}`,
    )}

`);

  process.exit(0);
};

export const deviceConfigured = async (configPath: string) => {
  process.stdout.write(`
✨ Configuration written to ${chalk.cyan(configPath)}.

Let's try adding a new snip:

    ${chalk.bold('$ snip add')}

`);

  process.exit(0);
};
