import type { H3Event } from "h3";
import { createError, setResponseStatus } from "h3";
import { AUTH_ERROR_CODES } from "../../../shared/types/auth.error";
import {
	addNoStoreHeaders,
	enforceJsonBodyLimit,
	enforceTrustedOrigin,
	getD1Database,
	hasActiveSession,
	hashPasswordRaw,
	insertAccount,
	limitRegister,
	readJsonBodyLimited,
	validateEmail,
	validateName,
	validatePassword,
} from "../../utils/accounts";

interface RegisterBody {
	name: string;
	email: string;
	password: string;
}

const ALLOWED_REGISTER_FIELDS: Record<string, true> = {
	name: true,
	email: true,
	password: true,
};

export default defineEventHandler(async (event) => {
	addNoStoreHeaders(event);
	enforceJsonBodyLimit(event);
	enforceTrustedOrigin(event);

	await limitRegister(event);

	const body = await readRegisterBody(event);
	const { name, email, password } = body;

	const validationError = validateRegistrationFields({ name, email, password });
	if (validationError !== null) {
		throw validationError;
	}

	if (await hasActiveSession(event)) {
		throw createError({
			statusCode: 409,
			data: { code: AUTH_ERROR_CODES.ALREADY_AUTHENTICATED },
		});
	}

	const passwordHash = await hashPasswordRaw(password);
	const account = await createAccountRow(event, { name, email, passwordHash });

	setResponseStatus(event, 201);
	return { success: true, account };
});

async function readRegisterBody(event: H3Event): Promise<RegisterBody> {
	const body = await readJsonBodyLimited(event);

	for (const key of Object.keys(body)) {
		if (!(key in ALLOWED_REGISTER_FIELDS)) {
			throw createError({
				statusCode: 400,
				data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
			});
		}
	}

	const name = body.name;
	const email = body.email;
	const password = body.password;
	if (
		typeof name !== "string" ||
		typeof email !== "string" ||
		typeof password !== "string"
	) {
		throw createError({
			statusCode: 400,
			data: { code: AUTH_ERROR_CODES.INVALID_INPUT },
		});
	}

	return { name, email, password };
}

function validateRegistrationFields(fields: RegisterBody): Error | null {
	const nameResult = validateName(fields.name);
	if (!nameResult.valid) {
		return createError({
			statusCode: 400,
			data: { code: nameResult.errorCode },
		});
	}

	const emailResult = validateEmail(fields.email);
	if (!emailResult.valid) {
		return createError({
			statusCode: 400,
			data: { code: emailResult.errorCode },
		});
	}

	const passwordResult = validatePassword(fields.password);
	if (!passwordResult.valid) {
		return createError({
			statusCode: 400,
			data: { code: passwordResult.errorCode },
		});
	}

	return null;
}

async function createAccountRow(
	event: H3Event,
	input: { name: string; email: string; passwordHash: string },
): Promise<{ id: string }> {
	const normalizedName = input.name.trim();
	const canonicalEmail = input.email.trim().toLowerCase();
	const db = getD1Database(event);
	const inserted = await insertAccount(
		db,
		normalizedName,
		canonicalEmail,
		input.passwordHash,
	);
	return { id: inserted.id };
}
