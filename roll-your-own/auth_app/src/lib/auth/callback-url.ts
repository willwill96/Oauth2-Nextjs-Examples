const invalidPaths = ["/api/auth/login", "/api/auth/login/callback"];

const DEFAULT_REDIRECT_PATH = "/";

const isAbsoluteUrl = (callbackUrl: string) => {
	try {
		// Only relative urls are valid
		new URL(callbackUrl);
		return true;
	} catch {}
	return false;
};

export function validateCallbackUrl(callbackUrl: string | null) {
	if (!callbackUrl || isAbsoluteUrl(callbackUrl)) return DEFAULT_REDIRECT_PATH;
	try {
		const url = new URL(callbackUrl, "http://localhost:3000");
		if (invalidPaths.includes(url.pathname)) {
			return DEFAULT_REDIRECT_PATH;
		}
		return url.pathname;
	} catch {}
	return DEFAULT_REDIRECT_PATH;
}
