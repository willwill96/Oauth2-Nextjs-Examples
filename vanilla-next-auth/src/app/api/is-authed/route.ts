import { serverSessionNextAuthConfig } from "@/lib/next-auth";
import { getServerSession } from "next-auth";

export const GET = async () => {
	const session = await getServerSession(serverSessionNextAuthConfig);
	if (session) return new Response(null, { status: 202 });
	return new Response(null, { status: 401 });
};
