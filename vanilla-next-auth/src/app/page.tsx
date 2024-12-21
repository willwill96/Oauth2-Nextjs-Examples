"use client";
import AuthStatusToast from "@/components/auth-status-toast";
import { Toaster } from "@/components/ui/toaster";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
	const { data, status } = useSession();
	return (
		<div className="grid bg-gray-500 items-start justify-items-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<div className="flex flex-col items-center w-full h-full justify-items-center gap-4">
				<div>
					{status === "authenticated"
						? `You are authenticated as ${data.user?.name}`
						: `You are not authenticated`}
				</div>

				<button
					className="border-2 border-orange-500 hover:bg-orange-400 hover:bg-opacity-50 text-gray-200 text-lg  p-2 rounded-sm"
					onClick={() => {
						if (status === "authenticated") {
							signOut();
						} else {
							signIn("keycloak");
						}
					}}
				>
					{status === "authenticated" ? "Sign Out" : "Sign In"}
				</button>
				<AuthStatusToast />
			</div>
			<Toaster />
		</div>
	);
}
