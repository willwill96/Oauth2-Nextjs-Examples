import { routesNextAuthConfig } from "@/lib/next-auth";
import NextAuth from "next-auth";

const { handlers } = NextAuth(routesNextAuthConfig);

const { GET, POST } = handlers;

export { GET, POST };
