import type { H3Event } from "h3";
import { getQuery } from "h3";
import type { AdminAccountsResponse } from "../../../shared/types/account";
import {
	addNoStoreHeaders,
	ensureJsonContentType,
	queryAdminAccounts,
	requireAdmin,
} from "../../utils/accounts";

export default defineEventHandler(
	async (event: H3Event): Promise<AdminAccountsResponse> => {
		const { db } = await requireAdmin(event);
		const { page, pageSize } = getQuery(event);

		const response = await queryAdminAccounts(
			db,
			Number(page) || 1,
			Number(pageSize) || 25,
		);

		addNoStoreHeaders(event);
		ensureJsonContentType(event);
		return response;
	},
);
