import type { H3Event } from "h3";
import type { UserProfile } from "../../../shared/types/account";
import { addNoStoreHeaders, requireAccount } from "../../utils/accounts";

export default defineEventHandler(
	async (event: H3Event): Promise<{ user: UserProfile }> => {
		const { user } = await requireAccount(event);
		addNoStoreHeaders(event);
		return { user };
	},
);
