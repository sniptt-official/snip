import type { EllipticCurveName } from 'openpgp';
import type { Arguments, CommandBuilder } from 'yargs';

import type { BaseOptions } from '../shared';

export type Options = BaseOptions & {
  email: string | undefined;
  name: string | undefined;
  curve: EllipticCurveName;
};

export type Builder = CommandBuilder<Options, Options>;

export type Handler = (argv: Arguments<Options>) => PromiseLike<void>;
