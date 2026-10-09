import { createError, getQuery, H3Error } from 'h3'
import { AUTH_ERROR_CODES } from '../../../shared/types/auth.error'
import {
  addNoStoreHeaders,
  ensureJsonContentType,
  getD1Database,
  queryAdminAccounts,
} from '../../utils/accounts'
import type { AdminAccountsResponse } from '../../../shared/types/account'

export default defineEventHandler(async (event): Promise<AdminAccountsResponse> => {
  try {
    const db = getD1Database()

    const { page, pageSize } = getQuery(event)
    const pageNumber = Number(page) || 1
    const pageSizeNumber = Number(pageSize) || 25

    const accounts: AdminAccountsResponse = await queryAdminAccounts(db, pageNumber, pageSizeNumber)

    addNoStoreHeaders(event)
    ensureJsonContentType(event)

    return accounts
  } catch (err) {
    // getD1Database throws 503 when the D1 binding is absent; rethrow as-is.
    if (err instanceof Error && 'statusCode' in err && (err as H3Error).statusCode === 503) throw err
    // Any other database failure is treated as a service interruption.
    throw createError({
      statusCode: 503,
      data: { code: AUTH_ERROR_CODES.SERVICE_UNAVAILABLE },
    })
  }
})
