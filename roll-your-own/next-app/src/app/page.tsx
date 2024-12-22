"use client";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
	const { data, isError } = useQuery({
		queryKey: ["auth-status"],
		queryFn: async () => {
			const response = await fetch("/api/auth/session");
			return await response.json();
		},
		refetchInterval: 1000 * 60 * 4,
	});
	const {status} = data || {}
	if (isError) return <div>Something went wrong</div>
	if (!data) return null
	return (
		<div className="grid bg-gray-500 items-start justify-items-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<div className="flex flex-col items-center w-full h-full justify-items-center gap-4">
				<div>
					{status === "authenticated"
						? `You are authenticated as ${data.user?.name}`
						: `You are not authenticated`}
				</div>

				<a
					className="border-2 border-orange-500 hover:bg-orange-400 hover:bg-opacity-50 text-gray-200 text-lg  p-2 rounded-sm"
					href={status === 'authenticated' ? "/api/auth/logout" : "/api/auth/login"}
				>
					{status === "authenticated" ? "Sign Out" : "Sign In"}
				</a>
			</div>
		</div>
	);
}
