import { logout } from "@/lib/auth/session";

export async function GET () {
    await logout()
    
    return new Response(null, {
            status: 302,
            headers: {
                Location: '/'
            }
        });
}