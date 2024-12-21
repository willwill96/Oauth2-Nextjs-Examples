import { jwtDecode } from "jwt-decode";
import { headers } from "next/headers";

export const GET = async () => {
	const headerz = await headers()
	if (headerz.get('x-forwarded-access-token')) {
		const decodedAccessToken = jwtDecode(headerz.get('x-forwarded-access-token'))
		return new Response(JSON.stringify({
			status: 'authenticated',
			name: decodedAccessToken.name
		}), {status: 200})
	}
	return new Response(JSON.stringify({
		status: 'unauthenticated'
	}), {status: 200})
};
