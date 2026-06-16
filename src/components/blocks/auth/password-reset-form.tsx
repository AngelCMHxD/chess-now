"use client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { InfoIcon } from "lucide-react";
import { type SubmitEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export function PasswordResetForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [linkSent, setLinkSent] = useState(false);
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [requiredInteraction, setRequiredInteraction] = useState(false);
	const [turnstileValid, setTurnstileValid] = useState(false);
	const turnstileRef = useRef<TurnstileInstance | null>(null);

	const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
		setSubmitting(true);
		e.preventDefault();

		const turnstileToken = turnstileRef.current?.getResponse();

		if (!turnstileToken) {
			toast.error("Captcha invalid. Refresh the page and try again.", {
				position: "bottom-center",
			});
			setSubmitting(false);
			return;
		}

		const res = await authClient.requestPasswordReset({
			email,
			redirectTo: "/account/change-password",
			fetchOptions: {
				headers: {
					"x-captcha-response": turnstileToken,
				},
			},
		});

		setTurnstileValid(false);
		turnstileRef.current?.reset();

		if (res.error) {
			toast.error(res.error.message || res.error.statusText, {
				position: "bottom-center",
				dismissible: true,
			});
		} else {
			setLinkSent(true);
		}
		setSubmitting(false);
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0">
					<form className="p-6 md:p-8" onSubmit={handleSubmit}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-2xl font-bold">
									Password Reset
								</h1>
								<p className="text-balance text-muted-foreground">
									Don't worry, we'll help you reset your
									password
								</p>
							</div>
							{linkSent && (
								<div>
									<Alert className="bg-accent">
										<InfoIcon />
										<AlertTitle>Success</AlertTitle>
										<AlertDescription>
											An email has been sent to you with a
											link to reset your password.
										</AlertDescription>
									</Alert>
								</div>
							)}
							{!linkSent && (
								<div className="space-y-4">
									<Field>
										<FieldLabel htmlFor="email">
											Email
										</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="m@example.com"
											required
											onChange={(e) =>
												setEmail(e.target.value)
											}
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
												"Reset Password"
											)}
										</Button>
									</Field>
								</div>
							)}
							<FieldSeparator />
							<FieldDescription className="text-center">
								If you use a third-party login, you don't need
								to enter your password.
								<br />
								In that case, you can just{" "}
								<a href="/account/login">sign in</a>.
							</FieldDescription>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
