import { KeyCloak } from "arctic";

export const keycloak = new KeyCloak(
	process.env.KEYCLOAK_ISSUER as string,
	process.env.KEYCLOAK_CLIENT_ID as string,
	process.env.KEYCLOAK_CLIENT_SECRET as string,
	"http://localhost:3000/api/auth/login/callback",
);
