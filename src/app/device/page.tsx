"use client";
import { redirect, useSearchParams } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export default function InputOTPForm() {
	const userCode = useSearchParams().get("user_code") || "";

	const [submitting, setSubmitting] = useState(false);
	const [code, setCode] = useState(userCode);

	const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitting(true);

		const response = await authClient.device({
			query: {
				user_code: userCode || code,
			},
		});

		if (response.error) {
			toast.error(response.error.error_description, {
				position: "bottom-center",
			});
			setSubmitting(false);
			return;
		}

		redirect(`/device/approval?code=${response.data?.user_code}`);
	};

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<div className="w-full max-w-md md:max-w-lg">
				<div className="flex flex-col gap-6">
					<Card className="overflow-hidden p-0">
						<CardContent className="grid p-0">
							<form
								className="p-6 md:p-8"
								onSubmit={handleSubmit}
							>
								<FieldGroup>
									<div className="flex flex-col items-center gap-2 text-center">
										<h1 className="text-2xl font-bold">
											Authenticate a device
										</h1>
										<p className="text-balance text-muted-foreground">
											Enter the verification code provided
											by the app.
										</p>
									</div>
									<Field>
										<div className="flex justify-center w-full">
											<div>
												<InputOTP
													maxLength={8}
													id="otp-verification"
													value={userCode}
													disabled={!!userCode}
													onChange={(e) => setCode(e)}
													required
												>
													<InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:text-lg">
														<InputOTPSlot
															index={0}
														/>
														<InputOTPSlot
															index={1}
														/>
														<InputOTPSlot
															index={2}
														/>
														<InputOTPSlot
															index={3}
														/>
														<InputOTPSlot
															index={4}
														/>
														<InputOTPSlot
															index={5}
														/>
														<InputOTPSlot
															index={6}
														/>
														<InputOTPSlot
															index={7}
														/>
													</InputOTPGroup>
												</InputOTP>
											</div>
										</div>
									</Field>
									<Field>
										<Button
											type="submit"
											disabled={submitting}
										>
											{submitting ? (
												<Spinner />
											) : (
												"Verify"
											)}
										</Button>
									</Field>
								</FieldGroup>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
			<div className="flex justify-end max-w-full">
				<ThemeSwitcher />
			</div>
		</div>
	);
}
<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
	<div className="w-full max-w-sm md:max-w-xl">
		<Card className="mx-auto max-w-md">
			<CardHeader>
				<CardTitle>Verify an external device/application</CardTitle>
				<CardDescription>
					Enter the verification code provided by the app.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Field>
					<div className="flex items-start">
						<FieldLabel htmlFor="otp-verification">
							Device code
						</FieldLabel>
					</div>
					<InputOTP maxLength={8} id="otp-verification" required>
						<InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
							<InputOTPSlot index={6} />
							<InputOTPSlot index={7} />
						</InputOTPGroup>
					</InputOTP>
				</Field>
			</CardContent>
			<CardFooter>
				<Field>
					<Button type="submit" className="w-full">
						Verify
					</Button>
				</Field>
			</CardFooter>
		</Card>
	</div>
	<div className="flex justify-end max-w-full">
		<ThemeSwitcher />
	</div>
</div>;
