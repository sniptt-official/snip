export enum Header {
  ApiKey = 'x-api-key'
}

export interface SnipttOpts {
  ApiKey?: string;
}

export enum ErrorCode {
  AccessGrantExistsError='AccessGrantExistsError',
  AccessGrantNotFoundError='AccessGrantNotFoundError',
  AccountEmailTakenError='AccountEmailTakenError',
  AccountKeychainNotConfiguredError='AccountKeychainNotConfiguredError',
  AccountNotActiveError='AccountNotActiveError',
  AccountNotFoundError='AccountNotFoundError',
  AwsClientUnexpectedResponseError='AwsClientUnexpectedResponseError',
  CounterpartAccountNotActiveError='CounterpartAccountNotActiveError',
  CounterpartAccountNotFoundError='CounterpartAccountNotFoundError',
  CounterpartEmailConflictError='CounterpartEmailConflictError',
  CounterpartPublicKeyNotFoundError='CounterpartPublicKeyNotFoundError',
  InvalidApiKeyError='InvalidApiKeyError',
  InvalidMessageAccessPatternError='InvalidMessageAccessPatternError',
  KeychainAlreadyConfiguredError='KeychainAlreadyConfiguredError',
  MaximumAccessGrantsCreatedError='MaximumAccessGrantsCreatedError',
  MaximumMessagesCreatedError='MaximumMessagesCreatedError',
  MessageExistsError='MessageExistsError',
  MessageNotFoundError='MessageNotFoundError',
  MissingApiKeyError='MissingApiKeyError',
  SchemaValidationFailure = 'SchemaValidationFailure',
}
