"use client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({
	className,
	redirectTo = "/account/dashboard",
	...props
}: React.ComponentProps<"div"> & { redirectTo?: string }) {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [requiredInteraction, setRequiredInteraction] = useState(false);
	const [turnstileValid, setTurnstileValid] = useState(false);
	const turnstileRef = useRef<TurnstileInstance | null>(null);

	const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);

		const turnstileToken = turnstileRef.current?.getResponse();

		if (!turnstileToken) {
			toast.error("Captcha invalid. Refresh the page and try again.", {
				position: "bottom-center",
			});
			setSubmitting(false);
			return;
		}

		const response = await authClient.signIn.email({
			email,
			password,
			fetchOptions: {
				headers: {
					"x-captcha-response": turnstileToken,
				},
			},
		});

		setTurnstileValid(false);
		turnstileRef.current?.reset();

		if (response.error) {
			toast.error(response.error.message || response.error.statusText, {
				position: "bottom-center",
			});
		} else {
			toast.success(
				`Logged in successfully as ${response.data.user.name}!`,
			);
			router.push(redirectTo);
		}

		setSubmitting(false);
	};

	const handleSocial = async (provider: "discord" | "google") => {
		const res = await authClient.signIn.social({
			provider,
			callbackURL: redirectTo,
		});

		if (res.error) {
			toast.error(res.error.message || res.error.statusText, {
				position: "bottom-center",
			});
			return;
		}

		window.location.assign(res.data.url as string);
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0">
					<form className="p-6 md:p-8" onSubmit={handleSubmit}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-2xl font-bold">
									Welcome back
								</h1>
								<p className="text-balance text-muted-foreground">
									Login to your Chess Now! account
								</p>
							</div>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">
										Password
									</FieldLabel>
									<a
										href="/account/forgot-password"
										className="ml-auto text-sm underline-offset-2 hover:underline"
									>
										Forgot your password?
									</a>
								</div>
								<Input
									id="password"
									type="password"
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
								/>
							</Field>
							<div
								className="flex justify-center"
								hidden={!requiredInteraction}
							>
								<Turnstile
									ref={turnstileRef}
									siteKey={
										process.env
											.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
										"1x00000000000000000000AA"
									}
									onSuccess={() => setTurnstileValid(true)}
									onBeforeInteractive={() =>
										setRequiredInteraction(true)
									}
									onExpire={() => setTurnstileValid(false)}
								/>
							</div>
							<Field>
								{/*had to kinda fake the disabled state as there were some hydration issues on reload i couldn't fix*/}
								<Button
									type="submit"
									aria-disabled={
										submitting || !turnstileValid
									}
									className={cn(
										(submitting || !turnstileValid) &&
											"pointer-events-none opacity-50",
									)}
									tabIndex={
										submitting || !turnstileValid ? -1 : 0
									}
								>
									{submitting || !turnstileValid ? (
										<Spinner />
									) : (
										"Log In"
									)}
								</Button>
							</Field>
							<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
								Or continue with
							</FieldSeparator>
							<Field className="grid grid-cols-2 gap-4">
								<Button
									variant="outline"
									type="button"
									onClick={() => handleSocial("google")}
								>
									<svg
										aria-label="Google Logo"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
									>
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
									<span className="sr-only">
										Login with Google
									</span>
								</Button>
								<Button
									variant="outline"
									type="button"
									onClick={() => handleSocial("discord")}
								>
									<svg
										aria-label="Discord Logo"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										className="fill-current"
									>
										<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
									</svg>
									<span className="sr-only">
										Login with Discord
									</span>
								</Button>
							</Field>
							<FieldDescription className="text-center">
								Don&apos;t have an account?{" "}
								<a href="/account/signup">Sign up</a>
							</FieldDescription>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our{" "}
				<a href="/legal/terms">Terms of Service</a> and{" "}
				<a href="/legal/privacy">Privacy Policy</a>.
			</FieldDescription>
		</div>
	);
}
