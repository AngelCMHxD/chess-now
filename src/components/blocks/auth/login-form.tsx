"use client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { GoogleIcon } from "@/components/icons/google-icon";
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
	redirectTo = "/dashboard",
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
									value={email}
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
									value={password}
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
									className="h-11"
									onClick={() => handleSocial("google")}
								>
									<GoogleIcon className="size-7" />
									<span className="sr-only">
										Sign in with Google
									</span>
								</Button>
								<Button
									variant="outline"
									type="button"
									className="h-11"
									onClick={() => handleSocial("discord")}
								>
									<DiscordIcon className="size-7" />
									<span className="sr-only">
										Sign in with Discord
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
