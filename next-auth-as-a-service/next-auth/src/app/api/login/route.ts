import { serverSessionNextAuthConfig } from "@/lib/next-auth";
import NextAuth from "next-auth";

const { signIn } = NextAuth(serverSessionNextAuthConfig);

export const GET = async (request) => {
	const url = new URL(request.url);
	const searchParams = url.searchParams;
	return signIn("keycloak", { redirectTo: searchParams.get("callbackUrl") });
};
