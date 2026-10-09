import { readBody, createError, setResponseHeader } from 'h3'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import {
  validateName,
  validatePassword,
  validateEmail,
  hashPasswordRaw,
  insertAccount,
  enforceRegistrationRateLimit,
  getD1Database,
  resolveRequestOrigin,
  TRUSTED_ORIGIN,
} from '../../utils/accounts'

interface RegisterBody {
  name: string
  email: string
  password: string
}

const ALLOWED_REGISTER_FIELDS: Record<string, true> = {
  name: true,
  email: true,
  password: true,
}

export default defineEventHandler(async (event) => {
  enforceSameOriginRegistration(event)

  await enforceRegistrationRateLimit(event)

  const body = await readRegisterBody(event)
  const { name, email, password } = body

  const validationError = validateRegistrationFields({ name, email, password })
  if (validationError !== null) {
    throw validationError
  }

  const passwordHash = await hashPasswordRaw(password)
  const account = await createAccountRow(event, { name, email, passwordHash })

  setNoStoreHeaders(event)

  return { success: true, account }
})

function enforceSameOriginRegistration(event: H3Event): void {
  const origin = resolveRequestOrigin(event)
  if (origin !== TRUSTED_ORIGIN) {
    throw createError({
      statusCode: 403,
      data: { code: AUTH_ERROR_CODES.FORBIDDEN },
    })
  }
}

async function readRegisterBody(event: H3Event): Promise<RegisterBody> {
  const body = await readBody< unknown >(event, { maxBodySize: 8192 })
  if (body === null || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
    })
  }

  const bodyRecord = body as Record<string, unknown>
  for (const key of Object.keys(bodyRecord)) {
    if (!(key in ALLOWED_REGISTER_FIELDS)) {
      throw createError({
        statusCode: 400,
        data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
      })
    }
  }

  return {
    name: bodyRecord.name as string,
    email: bodyRecord.email as string,
    password: bodyRecord.password as string,
  }
}

function validateRegistrationFields(fields: RegisterBody): H3Error | null {
  const nameResult = validateName(fields.name)
  if (!nameResult.valid) {
    return createError({ statusCode: 400, data: { code: nameResult.errorCode } })
  }

  const emailResult = validateEmail(fields.email)
  if (!emailResult.valid) {
    return createError({ statusCode: 400, data: { code: emailResult.errorCode } })
  }

  const passwordResult = validatePassword(fields.password)
  if (!passwordResult.valid) {
    return createError({ statusCode: 400, data: { code: passwordResult.errorCode } })
  }

  return null
}

async function createAccountRow(
  event: H3Event,
  input: { name: string; email: string; passwordHash: string },
): Promise<{ id: string }> {
  const normalizedName = input.name.trim()
  const canonicalEmail = input.email.trim().toLowerCase()
  const db = getD1Database()
  const inserted = await insertAccount(db, normalizedName, canonicalEmail, input.passwordHash)
  return { id: inserted.id }
}

function setNoStoreHeaders(event: H3Event): void {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Vary', 'Origin')
}