import { serverSessionNextAuthConfig } from "@/lib/next-auth";
import { getServerSession } from "next-auth";

export const GET = async () => {
	const session = await getServerSession(serverSessionNextAuthConfig);
	if (session) return new Response(null, { status: 202, headers: {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		'X-Auth-Request-Access-Token': session.access_token
	} });
	return new Response(null, { status: 401 });
};
