"use client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { AtSignIcon, CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { type SubmitEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignupForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [requiredInteraction, setRequiredInteraction] = useState(false);
	const [turnstileValid, setTurnstileValid] = useState(false);
	const turnstileRef = useRef<TurnstileInstance | null>(null);

	const [submitting, setSubmitting] = useState(false);
	const [created, setCreated] = useState(false);

	const [passwordChecks, setPasswordChecks] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		special: false,
	});

	const handleSocial = async (provider: "discord" | "google") => {
		await authClient.signIn.social({
			provider,
			callbackURL: "/dashboard",
		});
	};

	const normalizeUsernameInput = (value: string) =>
		value.toLowerCase().replace(/[^a-z0-9]/g, "");

	const onSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);
		if (
			Object.values(passwordChecks).every((check) => check) &&
			password === confirmPassword
		) {
			const turnstileToken = turnstileRef.current?.getResponse();

			if (!turnstileToken) {
				toast.error(
					"Captcha invalid. Refresh the page and try again.",
					{
						position: "bottom-center",
					},
				);
				setSubmitting(false);
				return;
			}

			const result = await authClient.signUp.email({
				name,
				email,
				password,
				username,
				callbackURL: "/account/signup/verified",
				fetchOptions: {
					headers: {
						"x-captcha-response": turnstileToken,
					},
				},
			});

			setTurnstileValid(false);
			turnstileRef.current?.reset();

			if (result.error) {
				toast.error(result.error.message || result.error.statusText, {
					position: "bottom-center",
				});
			} else {
				setCreated(true);
			}
		} else {
			toast.error("Your password does not meet the requirements", {
				position: "bottom-center",
			});
		}
		setSubmitting(false);
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0">
					<form className="p-6 md:p-8" onSubmit={onSubmit}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-2xl font-bold">
									Create your account
								</h1>
								<p className="text-sm text-balance text-muted-foreground">
									Enter your info below to create your account
								</p>
							</div>
							{created && (
								<div>
									<Alert className="bg-accent">
										<InfoIcon />
										<AlertTitle>Success</AlertTitle>
										<AlertDescription>
											Your account has been created
											successfully.
											<br />
											Verify your email to get started.
										</AlertDescription>
									</Alert>
								</div>
							)}

							{!created && (
								<div className="grid gap-4">
									<Field>
										<Field className="grid grid-cols-2 gap-4">
											<Field>
												<FieldLabel htmlFor="name">
													Name
												</FieldLabel>
												<Input
													id="name"
													type="text"
													placeholder="John Doe"
													value={name}
													onChange={(e) => {
														setName(e.target.value);
													}}
													required
												/>
											</Field>
											<Field>
												<FieldLabel htmlFor="username">
													Username
												</FieldLabel>
												<InputGroup>
													<InputGroupAddon>
														<AtSignIcon />
													</InputGroupAddon>
													<InputGroupInput
														id="username"
														type="text"
														placeholder="johndoe"
														value={username}
														onChange={(e) => {
															setUsername(
																normalizeUsernameInput(
																	e.target
																		.value,
																),
															);
														}}
														required
													/>
												</InputGroup>
											</Field>
										</Field>
									</Field>
									<Field>
										<FieldLabel htmlFor="email">
											Email
										</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="m@example.com"
											value={email}
											onChange={(e) => {
												setEmail(e.target.value);
											}}
											required
										/>
										<FieldDescription>
											We&apos;ll use this to contact you.
											We will not share your email with
											anyone else.
										</FieldDescription>
									</Field>
									<Field>
										<Field className="grid grid-cols-2 gap-4">
											<Field>
												<FieldLabel htmlFor="password">
													Password
												</FieldLabel>
												<Input
													id="password"
													type="password"
													value={password}
													onChange={(e) => {
														setPassword(
															e.target.value,
														);
														setPasswordChecks(
															(prev) => ({
																...prev,
																length:
																	e.target
																		.value
																		.length >=
																	8,
																uppercase:
																	/[A-Z]/.test(
																		e.target
																			.value,
																	),
																lowercase:
																	/[a-z]/.test(
																		e.target
																			.value,
																	),
																special:
																	/[!@#$%^&*(),.?":{}|<>]/.test(
																		e.target
																			.value,
																	),
															}),
														);
													}}
													required
												/>
											</Field>
											<Field
												data-invalid={
													password !== confirmPassword
												}
											>
												<FieldLabel htmlFor="confirm-password">
													Confirm Password
												</FieldLabel>
												<Input
													id="confirm-password"
													type="password"
													value={confirmPassword}
													onChange={(e) => {
														setConfirmPassword(
															e.target.value,
														);
													}}
													aria-invalid={
														password !==
														confirmPassword
													}
													required
												/>
											</Field>
										</Field>
										<FieldContent>
											<div className="flex items-center gap-1">
												{(!passwordChecks.lowercase && (
													<XIcon className="text-destructive" />
												)) || (
													<CheckIcon className="text-primary" />
												)}{" "}
												Must have at least 1 lowercase
												letter.
											</div>
											<div className="flex items-center gap-1">
												{(!passwordChecks.uppercase && (
													<XIcon className="text-destructive" />
												)) || (
													<CheckIcon className="text-primary" />
												)}{" "}
												Must have at least 1 uppercase
												letter.
											</div>
											<div className="flex items-center gap-1">
												{(!passwordChecks.special && (
													<XIcon className="text-destructive" />
												)) || (
													<CheckIcon className="text-primary" />
												)}{" "}
												Must have at least 1 special
												character.
											</div>
											<div className="flex items-center gap-1">
												{(!passwordChecks.length && (
													<XIcon className="text-destructive" />
												)) || (
													<CheckIcon className="text-primary" />
												)}{" "}
												Must be at least 8 characters
												long.
											</div>
											<div className="flex items-center gap-1">
												{((password !==
													confirmPassword ||
													confirmPassword === "") && (
													<XIcon className="text-destructive" />
												)) || (
													<CheckIcon className="text-primary" />
												)}{" "}
												Passwords must match.
											</div>
										</FieldContent>
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
											onSuccess={() =>
												setTurnstileValid(true)
											}
											onBeforeInteractive={() =>
												setRequiredInteraction(true)
											}
											onExpire={() =>
												setTurnstileValid(false)
											}
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
												(submitting ||
													!turnstileValid) &&
													"pointer-events-none opacity-50",
											)}
											tabIndex={
												submitting || !turnstileValid
													? -1
													: 0
											}
										>
											{submitting || !turnstileValid ? (
												<Spinner />
											) : (
												"Sign Up"
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
												Sign up with Google
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
												Sign up with Discord
											</span>
										</Button>
									</Field>
									<FieldDescription className="text-center">
										Already have an account?{" "}
										<a href="/account/login">Sign in</a>
									</FieldDescription>
								</div>
							)}
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
