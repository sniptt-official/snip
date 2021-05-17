
import got from 'got'
import {object, string} from 'yup'
import ApiError from './error'
import {ErrorCode} from './types'

const {BASE_URI = 'api.beta.snipt.io'} = process.env

const ErrorSchema = object({
  ErrorMessage: string().required(),
  ErrorCode: string().oneOf(Object.keys(ErrorCode)),
  Hint: string(),
})

const httpClient = got.extend({
  prefixUrl: `https://${BASE_URI}/v1`,
  hooks: {
    beforeError: [
      (error: ApiError)  => {
        const errorDetails = error.response ? error.response.body : undefined

        if (errorDetails) {
          const apiError = ErrorSchema.validateSync(error.response?.body)

          error.code = apiError.ErrorCode
          error.message = apiError.ErrorMessage
          error.hint = apiError.Hint
        }

        return new ApiError(error, error.request!)
      },
    ],
  },
})

export default httpClient
