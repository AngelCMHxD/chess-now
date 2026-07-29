import { Suspense } from "react";
import { PasswordChangeForm } from "@/components/blocks/auth/password-change-form";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function ChangePasswordPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-xl">
				<Suspense>
					<PasswordChangeForm />
				</Suspense>
			</div>
			<div className="flex justify-end max-w-full">
				<ThemeSwitcher />
			</div>
		</div>
	);
}
