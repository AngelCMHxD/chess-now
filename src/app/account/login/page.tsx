"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/blocks/auth/login-form";
import { ThemeSwitcher } from "@/components/theme-switcher";

function LoginContent() {
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo") || undefined;
	return <LoginForm redirectTo={redirectTo} />;
}

export default function LoginPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-xl">
				<Suspense>
					<LoginContent />
				</Suspense>
			</div>
			<div className="flex justify-end max-w-full">
				<ThemeSwitcher />
			</div>
		</div>
	);
}
