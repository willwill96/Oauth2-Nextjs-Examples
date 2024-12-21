import { jwtDecode } from "jwt-decode";
import type { AuthOptions } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

interface JwtInterface {
	exp: number;
}

declare module "next-auth/jwt" {
	interface JWT {
		access_token?: string;
		refresh_token?: string;
		id_token?: string;
	}
}

const isJwtExpired = (accessToken: { exp: number }) => {
	// Buffer expiration by 1 minute
	return Date.now() + 1000 * 60 > accessToken.exp * 1000;
};

const refreshAccessToken = async (refresh_token: string) => {
	const res = await fetch(
		`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: process.env.KEYCLOAK_CLIENT_ID as string,
				client_secret: process.env.KEYCLOAK_CLIENT_SECRET as string,
				grant_type: "refresh_token",
				refresh_token,
			}),
		},
	);
	const json = await res.json();
	return json;
};

const baseOptions = {
	// https://next-auth.js.org/providers/keycloak#options
	providers: [
		Keycloak({
			clientId: process.env.KEYCLOAK_CLIENT_ID as string,
			clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
			issuer: process.env.KEYCLOAK_ISSUER,
			name: "keycloak",
		}),
	],
	// https://next-auth.js.org/configuration/callbacks
	callbacks: {
		jwt: async ({ account, token }) => {
			if (account) {
				return {
					...token,
					access_token: account.access_token,
					id_token: account.id_token,
					refresh_token: account.refresh_token,
				};
			}
			// Perform refresh token rotation
			if (token.access_token) {
				const decodedRefreshToken = jwtDecode<JwtInterface>(
					token.access_token as string,
				);
				const decodedAccessToken = jwtDecode<JwtInterface>(
					token.access_token as string,
				);
				if (isJwtExpired(decodedRefreshToken)) {
					return {};
				}
				if (isJwtExpired(decodedAccessToken)) {
					const refreshed = await refreshAccessToken(
						token.refresh_token as string,
					);
					return {
						...token,
						id_token: refreshed.id_token,
						access_token: refreshed.access_token,
						refresh_token: refreshed.refresh_token,
					};
				}
			}

			return token;
		},
	},
	events: {
		async signOut(params) {
			// Ensure Keycloak session is destroyed when signing out
			await fetch(
				`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?id_token_hint=${params.token.id_token}`,
			);
		},
	},
} as AuthOptions;

export const routesNextAuthConfig = {
	...baseOptions,
	callbacks: {
		...baseOptions.callbacks,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		session: (params) => {
			// This is technically breaking the typescript definition for the session callback, but this forces the client-side next-auth
			// utilities to recognize your session as unauthenticated once your access token is expired
			if (!params.token.access_token) return {};
			return params.session;
		},
	},
} as AuthOptions;

// We maintain a separate config for getServerSession calls so that access tokens are only available as part of client-side calls
export const serverSessionNextAuthConfig = {
	...baseOptions,
	callbacks: {
		...baseOptions.callbacks,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		session: (params) => {
			// This is technically breaking the typescript definition for the session callback, but this forces the client-side next-auth
			// utilities to recognize your session as unauthenticated once your access token is expired
			if (!params.token.access_token) return {};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			params.session.access_token = params.token.access_token;
			return params.session;
		},
	},
} as AuthOptions;
