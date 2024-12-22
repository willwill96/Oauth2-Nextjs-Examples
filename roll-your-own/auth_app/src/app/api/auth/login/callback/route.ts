import { cookies } from "next/headers";

import type { OAuth2Tokens } from "arctic";
import { KEYCLOAK_CODE_VERIFIER_COOKIE, KEYCLOAK_NONCE_COOKIE, KEYCLOAK_STATE_COOKIE, CALLBACK_URL_COOKIE } from "@/lib/auth/cookies";
import { keycloak } from "@/lib/auth/keycloak";
import { createSession } from "@/lib/auth/session";
import { decodeJWT } from "@oslojs/jwt";
import { validateCallbackUrl } from "@/lib/auth/callback-url";

export async function GET(request: Request): Promise<Response> {
    const cookieStore = await cookies()
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = cookieStore.get(KEYCLOAK_STATE_COOKIE)?.value ?? null;
    const codeVerifier = cookieStore.get(KEYCLOAK_CODE_VERIFIER_COOKIE)?.value ?? null;
    const nonce = cookieStore.get(KEYCLOAK_NONCE_COOKIE)?.value ?? null;
	if (code === null || state === null || storedState === null || codeVerifier === null || nonce === null) {
		return new Response("Please restart the process.", {
			status: 400
		});
	}
	if (state !== storedState) {
        console.warn('state mismatch')
		return new Response("Please restart the process.", {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await keycloak.validateAuthorizationCode(code, codeVerifier);
	} catch {
        console.warn('validating authorization code failed')
		// Invalid code or client credentials
		return new Response("Please restart the process.", {
			status: 400
		});
	}
    try {
        const id_token = decodeJWT(tokens.idToken())
        if ((id_token as { nonce?: string}).nonce !== nonce) {
            console.warn('id_token nonce validation failed')
            return new Response("Please restart the process.", {
                status: 400
            });
        }
    } catch {
        return new Response("Please restart the process.", {
			status: 400
		});
    }
    await createSession(tokens)

    const callbackUrl = cookieStore.get(CALLBACK_URL_COOKIE)?.value ?? null;
    return new Response(null, {
        status: 302,
        headers: {
            Location: validateCallbackUrl(callbackUrl ? decodeURIComponent(callbackUrl) : null)
        }
    });
}