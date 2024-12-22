import { validateCallbackUrl } from '@/lib/auth/callback-url';
import { AUTH_FLOW_COOKIE_SETTINGS, KEYCLOAK_CODE_VERIFIER_COOKIE, KEYCLOAK_NONCE_COOKIE, KEYCLOAK_STATE_COOKIE, CALLBACK_URL_COOKIE } from '@/lib/auth/cookies';
import { keycloak } from '@/lib/auth/keycloak';
import { generateState, generateCodeVerifier } from 'arctic'
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { v4 } from 'uuid';

export async function GET(request: NextRequest): Promise<Response> {
	const url = new URL(request.url);
	const searchParams = url.searchParams;
	const callbackUrl = validateCallbackUrl(searchParams.get('callbackUrl'))
	const state = generateState();
    const codeVerifier = generateCodeVerifier()
	const redirectUrl = keycloak.createAuthorizationURL(state, codeVerifier, ["openid", "email"]);
	const nonce = v4()
    const cookieStore = await cookies()
	


	cookieStore.set(KEYCLOAK_STATE_COOKIE, state, AUTH_FLOW_COOKIE_SETTINGS);

	cookieStore.set(CALLBACK_URL_COOKIE, encodeURIComponent(callbackUrl), AUTH_FLOW_COOKIE_SETTINGS);

	cookieStore.set(KEYCLOAK_CODE_VERIFIER_COOKIE, codeVerifier, AUTH_FLOW_COOKIE_SETTINGS);

	cookieStore.set(KEYCLOAK_NONCE_COOKIE, nonce, AUTH_FLOW_COOKIE_SETTINGS)

	const redirectUrlWithNonce = `${redirectUrl.toString()}&nonce=${nonce}`
	return new Response(null, {
		status: 302,
		headers: {
			Location: redirectUrlWithNonce
		}
	});
}