import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { OAuth2Tokens } from "arctic";
import { createClient } from "redis";
import { SESSION_ID_COOKIE } from "./cookies";
import { cookies } from "next/headers";
import { sha256 } from "@oslojs/crypto/sha2";
import { decodeJWT } from "@oslojs/jwt";
import { keycloak } from "./keycloak";

const REDIS_FIELDS = {
	ACCESS_TOKEN: "access_token",
	REFRESH_TOKEN: "refresh_token",
	ID_TOKEN: "id_token",
	ACCESS_TOKEN_EXPIRY: "access_token_expiry",
	USER_EMAIL: "user_email",
} as const;

const client = await createClient({
	url: process.env.REDIS_URL as string,
})
	.on("error", (err) => console.log("Redis client error", err))
	.connect();

async function invalidateSession(sessionId: string): Promise<void> {
	await client.del(`session:${sessionId}`);
}

async function executeBackchannelLogout(id_token: string) {
	return fetch(
		`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?id_token_hint=${id_token}`,
	);
}

export async function logout(): Promise<void> {
	const session = await getSession();
	if (!session) {
		console.warn("session:logout: No session found, returning");
		return;
	}
	const { id_token, session_id } = session;
	if (id_token) {
		await executeBackchannelLogout(id_token);
	}
	await invalidateSession(session_id);
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_ID_COOKIE);
}

function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32(tokenBytes).toLowerCase();
	return token;
}

async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_ID_COOKIE, token, {
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		expires: expiresAt,
	});
}

type BackendSession = {
	access_token: string;
	user_email: string;
	refresh_token: string;
	id_token: string;
	access_token_expiry: number;
};

type BackendSessionWithId = BackendSession & {
	session_id: string;
};

function tokensToRedisSession(tokens: OAuth2Tokens): [BackendSession, Date] {
	const access_token = tokens.accessToken();
	const refresh_token = tokens.refreshToken();
	const id_token = tokens.idToken();
	const parsedAccessToken = decodeJWT(access_token) as {
		exp: number;
		email: string;
	};
	const parsedRefreshToken = decodeJWT(refresh_token) as { exp: number };
	return [
		{
			[REDIS_FIELDS.ACCESS_TOKEN]: access_token,
			[REDIS_FIELDS.REFRESH_TOKEN]: refresh_token,
			[REDIS_FIELDS.ID_TOKEN]: id_token,
			[REDIS_FIELDS.ACCESS_TOKEN_EXPIRY]: parsedAccessToken.exp,
			[REDIS_FIELDS.USER_EMAIL]: parsedAccessToken.email,
		},
		new Date(parsedRefreshToken.exp * 1000 - 60 * 1000),
	];
}

export async function createSession(
	tokens: OAuth2Tokens,
): Promise<BackendSessionWithId> {
	const sessionToken = generateSessionToken();
	const sessionId = encodeHexLowerCase(
		sha256(new TextEncoder().encode(sessionToken)),
	);

	const [baseSession, expiryDate] = tokensToRedisSession(tokens);
	await client.hSet(`session:${sessionId}`, baseSession);
	await client.expire(
		`session:${sessionId}`,
		Math.floor((expiryDate.getTime() - Date.now()) / 1000),
	);
	await setSessionCookie(sessionToken, expiryDate);
	return { session_id: sessionId, ...baseSession };
}

export async function updateSession(
	tokens: OAuth2Tokens,
	sessionToken: string,
	sessionId: string,
): Promise<BackendSessionWithId> {
	const [baseSession, expiryDate] = tokensToRedisSession(tokens);
	await client.hSet(`session:${sessionId}`, baseSession);
	await client.expire(
		`session:${sessionId}`,
		Math.floor((expiryDate.getTime() - Date.now()) / 1000),
	);
	await setSessionCookie(sessionToken, expiryDate);
	return { session_id: sessionId, ...baseSession };
}

async function refreshTokens(
	session: BackendSession,
	sessionToken: string,
	sessionId: string,
) {
	try {
		const tokens = await keycloak.refreshAccessToken(session.refresh_token);
		return await updateSession(tokens, sessionToken, sessionId);
	} catch {}
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_ID_COOKIE);
	console.warn("Error refresh tokens. Invalidating session");
	return null;
}

export async function getSession(): Promise<null | BackendSessionWithId> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(SESSION_ID_COOKIE);
	if (!sessionToken?.value) {
		return null;
	}
	const sessionId = encodeHexLowerCase(
		sha256(new TextEncoder().encode(sessionToken?.value)),
	);
	const session = (await client.hGetAll(
		`session:${sessionId}`,
	)) as unknown as BackendSession;

	// Buffer by 1 minute
	if (Date.now() > session.access_token_expiry * 1000 - 1000 * 60) {
		return await refreshTokens(session, sessionToken?.value, sessionId);
	}

	return { ...session, session_id: sessionId };
}
