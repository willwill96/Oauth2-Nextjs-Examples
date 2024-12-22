import { getSession } from "@/lib/auth/session";


export const GET = async () => {
    const session = await getSession()

	if (session) return new Response(null, { status: 202, headers: {
        "X-Auth-Request-Access-Token": session.access_token
    }});
	return new Response(null, { status: 401 });
};
