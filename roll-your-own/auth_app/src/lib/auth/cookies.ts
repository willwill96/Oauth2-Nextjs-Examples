import { cookies } from "next/headers";

export const KEYCLOAK_STATE_COOKIE = "node_keycloak_oidc_state";

export const KEYCLOAK_CODE_VERIFIER_COOKIE = "node_keycloak_pkce_code_verifier";

export const KEYCLOAK_NONCE_COOKIE = "node_keycloak_nonce";

export const SESSION_ID_COOKIE = "node_session_token";

export const CALLBACK_URL_COOKIE = "node_auth_callback_url";

export const AUTH_FLOW_COOKIE_SETTINGS = {
	path: "/",
	secure: process.env.NODE_ENV === "production",
	httpOnly: true,
	maxAge: 60 * 15,
	sameSite: "lax",
} as const;

export async function clearAllAuthCookies() {
	const cookieStore = await cookies();

	(
		[
			KEYCLOAK_STATE_COOKIE,
			KEYCLOAK_CODE_VERIFIER_COOKIE,
			KEYCLOAK_NONCE_COOKIE,
			SESSION_ID_COOKIE,
			CALLBACK_URL_COOKIE,
		] as string[]
	).forEach((cookie) => {
		cookieStore.delete(cookie);
	});
}
