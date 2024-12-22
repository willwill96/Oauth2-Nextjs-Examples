import { jwtDecode } from "jwt-decode";
import { headers } from "next/headers";

export const GET = async () => {
	const headerz = await headers();
	if (headerz.get("x-forwarded-access-token")) {
		const decodedAccessToken = jwtDecode(
			headerz.get("x-forwarded-access-token") as string,
		);
		return new Response(
			JSON.stringify({
				status: "authenticated",
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
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
