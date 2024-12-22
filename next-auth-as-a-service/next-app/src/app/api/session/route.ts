import { jwtDecode } from "jwt-decode";
import { headers } from "next/headers";

interface KeycloakAccessToken {
	name: string;
}

export const GET = async () => {
	const headerz = await headers();
	if (headerz.get("x-auth-request-access-token")) {
		const decodedAccessToken = jwtDecode<KeycloakAccessToken>(
			headerz.get("x-auth-request-access-token") as string,
		);
		return new Response(
			JSON.stringify({
				status: "authenticated",
				name: decodedAccessToken.name,
			}),
			{ status: 200 },
		);
	}
	return new Response(
		JSON.stringify({
			status: "unauthenticated",
		}),
		{ status: 200 },
	);
};
