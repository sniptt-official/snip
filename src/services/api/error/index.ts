import Request, {RequestError} from 'got/dist/source/core'

export default class ApiError extends RequestError {
  hint?: string;

  constructor(error: Error, request: Request) {
    super(error.message, error, request)
    this.name = 'ApiError'
  }
}
