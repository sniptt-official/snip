export enum Header {
  ApiKey = 'x-api-key',
}

export interface ProtectedApiCallOpts {
  ApiKey: string;
}
