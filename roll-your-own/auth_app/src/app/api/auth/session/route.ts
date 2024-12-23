import { getSession } from "@/lib/auth/session";
import { decodeJWT } from "@oslojs/jwt";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({
			status: "unauthenticated",
		});
	}
	const decodedAccessToken = decodeJWT(session.access_token) as {
		name: string;
	};
	return NextResponse.json({
		status: "authenticated",
		user: {
			name: decodedAccessToken.name,
		},
	});
}
