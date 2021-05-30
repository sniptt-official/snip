export type BaseOptions = {
  profile: string;
  quiet: boolean;
  json: boolean | undefined;
};

export const baseOptions = {
  profile: { type: 'string', default: 'default' },
  quiet: { type: 'boolean', default: false, alias: 'q' },
  json: { type: 'boolean', conflicts: 'output' },
} as const;
