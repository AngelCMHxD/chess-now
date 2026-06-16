import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (request.nextUrl.pathname === "/account") {
		return NextResponse.redirect(
			new URL("/account/dashboard", request.url),
		);
	}

	if (!session && request.nextUrl.pathname.startsWith("/account/dashboard")) {
		return NextResponse.redirect(new URL("/account/login", request.url));
	}

	if (
		session &&
		["/account/login", "/account/signup"].includes(request.nextUrl.pathname)
	) {
		return NextResponse.redirect(
			new URL("/account/dashboard", request.url),
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: "/account/:path*",
};
