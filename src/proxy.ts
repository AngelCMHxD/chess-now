import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (["/account"].includes(request.nextUrl.pathname)) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
		return NextResponse.redirect(new URL("/account/login", request.url));
	}

	if (!session && request.nextUrl.pathname.startsWith("/device")) {
		const code = request.nextUrl.searchParams.get("user_code") || undefined;
		return NextResponse.redirect(
			new URL(
				`/account/login?redirectTo=%2Fdevice${code ? `%3Fuser_code%3D${code}` : ""}`,
				request.url,
			),
		);
	}

	if (
		session &&
		["/account/login", "/account/signup"].includes(request.nextUrl.pathname)
	) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/account/:path*", "/device", "/dashboard/:path*"],
};
