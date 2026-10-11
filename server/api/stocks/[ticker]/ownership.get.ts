import type { H3Event } from "h3";
import type { OwnershipRow } from "../../../../shared/types/account";
import {
	addNoStoreHeaders,
	normalizeOwnershipTicker,
	queryOwnershipByStockCode,
	requireAccount,
} from "../../../utils/accounts";

export default defineEventHandler(
	async (event: H3Event): Promise<OwnershipRow[]> => {
		const { db } = await requireAccount(event);
		const ticker = normalizeOwnershipTicker(
			getRouterParam(event, "ticker") ?? "",
		);

		const records = await queryOwnershipByStockCode(db, ticker);
		addNoStoreHeaders(event);
		return records;
	},
);
