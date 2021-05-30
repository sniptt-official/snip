import type { Arguments, CommandBuilder } from 'yargs';

import type { BaseOptions } from '../../shared';

export type Options = BaseOptions & {
  name: string;
  email: string;
  role: 'read' | 'admin';
};

export type Builder = CommandBuilder<{}, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;
