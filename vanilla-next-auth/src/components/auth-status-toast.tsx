"use client";
import { useToast } from "@/hooks/use-toast";

export default function AuthStatusToast() {
	const { toast } = useToast();

	return (
		<button
			className="bg-blue-400 hover:bg-blue-500 p-2 rounded-sm"
			onClick={async () => {
				const res = await fetch("/api/is-authed");
				toast({
					title: `Request ${res.status === 202 ? "Accepted" : "Denied"}`,
					variant: res.status === 202 ? "default" : "destructive",
				});
			}}
		>
			Click this button to initiate a request that requires authentication
		</button>
	);
}
