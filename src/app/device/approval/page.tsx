"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export default function InputOTPForm() {
	const code = useSearchParams().get("code") || "";
	const [submittingApprove, setSubmittingApprove] = useState(false);
	const [submittingDeny, setSubmittingDeny] = useState(false);

	const handleApprove = async () => {
		setSubmittingApprove(true);
		const response = (await fetch(
			`${process.env.API_ENDPOINT}/device/approve`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userCode: code,
				}),
				credentials: "include",
			},
		).then((res) => res.json())) as {
			success: boolean;
		};

		if (!response.success) {
			toast.error("Couldn't process request", {
				position: "bottom-center",
			});
			setSubmittingApprove(false);
			return;
		}

		setSubmittingApprove(false);
		toast.success("Approved!", {
			position: "bottom-center",
		});
	};

	const handleDeny = async () => {
		setSubmittingDeny(true);
		const response = (await fetch(
			`${process.env.API_ENDPOINT}/device/deny`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userCode: code,
				}),
				credentials: "include",
			},
		).then((res) => res.json())) as {
			success: boolean;
		};

		if (!response.success) {
			toast.error("Couldn't process request", {
				position: "bottom-center",
			});
			setSubmittingDeny(false);
			return;
		}

		setSubmittingDeny(false);
		toast.success("Denied!", {
			position: "bottom-center",
		});
	};

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<div className="w-full max-w-md md:max-w-lg">
				<div className="flex flex-col gap-6">
					<Card className="mx-auto max-w-md">
						<CardHeader>
							<CardTitle>
								Verify an external device/application
							</CardTitle>
						</CardHeader>
						<CardContent>
							Are you sure that you want to authenticate with this
							application? This will give complete access to your
							account.
						</CardContent>
						<CardFooter>
							<Field>
								<Button
									type="submit"
									className="w-full"
									onClick={handleApprove}
									disabled={
										submittingApprove || submittingDeny
									}
								>
									{submittingApprove ? (
										<Spinner />
									) : (
										"Approve"
									)}
								</Button>
								<Button
									variant="secondary"
									className="w-full"
									onClick={handleDeny}
									disabled={
										submittingApprove || submittingDeny
									}
								>
									{submittingDeny ? <Spinner /> : "Deny"}
								</Button>
							</Field>
						</CardFooter>
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
			</CardHeader>
			<CardContent>
				Are you sure that you want to authenticate with this
				application? This will give complete access to your account as a
				token will be given to the app.
			</CardContent>
			<CardFooter>
				<Field>
					<Button variant="secondary" className="w-full">
						Deny
					</Button>
					<Button type="submit" className="w-full">
						Approve
					</Button>
				</Field>
			</CardFooter>
		</Card>
	</div>
	<div className="flex justify-end max-w-full">
		<ThemeSwitcher />
	</div>
</div>;
