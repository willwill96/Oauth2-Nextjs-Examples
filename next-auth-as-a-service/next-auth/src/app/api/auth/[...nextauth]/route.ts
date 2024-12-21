import { routesNextAuthConfig } from "@/lib/next-auth";
import NextAuth from "next-auth";

const handler = NextAuth(routesNextAuthConfig);

export { handler as GET, handler as POST };
