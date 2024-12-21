import { serverSessionNextAuthConfig } from "@/lib/next-auth";
import NextAuth from "next-auth";
const { auth } = NextAuth(serverSessionNextAuthConfig)
export const GET = async () => {
	const session = await auth();
	if (session) return new Response(null, { status: 202, headers: {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		'X-Auth-Request-Access-Token': session.access_token
	} });
	return new Response(null, { status: 401 });
};
