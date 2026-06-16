"use client";
import { AlertTriangleIcon, CheckIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function PasswordChangeForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const searchParams = useSearchParams();

	const [passwordChanged, setPasswordChanged] = useState(false);
	const [loading, setLoading] = useState(false);

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [passwordChecks, setPasswordChecks] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		special: false,
	});

	const token = searchParams.get("token");

	if (searchParams.get("error") === "INVALID_TOKEN" || !token) {
		return (
			<div className={cn("flex flex-col gap-6", className)} {...props}>
				<Card className="overflow-hidden p-0">
					<CardContent className="grid p-0">
						<FieldGroup>
							<div className="p-6 pb-0 md:p-8 md:pb-0">
								<div>
									<Alert className="bg-accent">
										<AlertTriangleIcon />
										<AlertTitle>Error</AlertTitle>
										<AlertDescription>
											Invalid token. Please request a new
											password change link.
										</AlertDescription>
									</Alert>
								</div>
							</div>
							<CardFooter>
								<Field>
									<Button asChild>
										<Link href="/account/forgot-password">
											Request a new link
										</Link>
									</Button>
									<Button variant="secondary" asChild>
										<Link href="/">Back to Home</Link>
									</Button>
								</Field>
							</CardFooter>
						</FieldGroup>
					</CardContent>
				</Card>
			</div>
		);
	}

	const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
		setLoading(true);
		e.preventDefault();
		if (
			Object.values(passwordChecks).every((check) => check) &&
			password === confirmPassword
		) {
			const res = await authClient.resetPassword({
				token,
				newPassword: password,
			});

			if (res.error) {
				if (res.error.code === "INVALID_TOKEN") {
					redirect("/account/change-password?error=INVALID_TOKEN");
				}
				toast.error(res.error.message || res.error.statusText, {
					position: "bottom-center",
					dismissible: true,
				});
			} else {
				setPasswordChanged(true);
			}
		} else {
			toast.error("Your password does not meet the requirements", {
				position: "bottom-center",
			});
		}
		setLoading(false);
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0">
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							{!passwordChanged && (
								<div>
									<div className="p-6 pb-0 md:p-8 md:pb-0">
										<div className="flex flex-col items-center gap-2 text-center">
											<h1 className="text-2xl font-bold">
												Change Password
											</h1>
											<p className="text-balance text-muted-foreground">
												Enter your new password below.
											</p>
										</div>
										<div className="grid gap-4">
											<Field>
												<FieldLabel htmlFor="password">
													Password
												</FieldLabel>
												<Input
													id="password"
													type="password"
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
											<FieldContent>
												<div className="flex items-center gap-1">
													{(!passwordChecks.lowercase && (
														<XIcon className="text-destructive" />
													)) || (
														<CheckIcon className="text-primary" />
													)}{" "}
													Must have at least 1
													lowercase letter.
												</div>
												<div className="flex items-center gap-1">
													{(!passwordChecks.uppercase && (
														<XIcon className="text-destructive" />
													)) || (
														<CheckIcon className="text-primary" />
													)}{" "}
													Must have at least 1
													uppercase letter.
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
													Must be at least 8
													characters long.
												</div>
												<div className="flex items-center gap-1">
													{((password !==
														confirmPassword ||
														confirmPassword ===
															"") && (
														<XIcon className="text-destructive" />
													)) || (
														<CheckIcon className="text-primary" />
													)}{" "}
													Passwords must match.
												</div>
											</FieldContent>
										</div>
									</div>
								</div>
							)}
							<CardFooter>
								<Field>
									<Button type="submit" disabled={loading}>
										{loading ? (
											<Spinner />
										) : (
											"Change Password"
										)}
									</Button>
								</Field>
							</CardFooter>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
