"use client";
import type {
	ApiSuccessResponse,
	DeviceInfoResponse,
	ScopeType,
} from "@chess-now/api";
import { CheckCircle2Icon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const scopesDescriptions: Record<ScopeType, string> = {
	account: "Update your profile info",
	challenges: "Send and manage challenges",
	bots: "Manage bots created under your account",
	friends: "Send friend requests and manage your friend list",
	matches: "Create new matches and play running matches",
};

export default function InputOTPForm() {
	const code = useSearchParams().get("code") || "";
	const [submittingApprove, setSubmittingApprove] = useState(false);
	const [submittingDeny, setSubmittingDeny] = useState(false);
	const [loading, setLoading] = useState(true);
	const [scopes, setScopes] = useState<ScopeType[] | null>(null);
	const [invalidCode, setInvalidCode] = useState(false);

	useEffect(() => {
		const abortController = new AbortController();

		const fetchData = async () => {
			const abortController = new AbortController();
			setLoading(true);

			const response = (await fetch(
				`${process.env.NEXT_PUBLIC_API_ENDPOINT}/device/${code}`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					signal: abortController.signal,
				},
			).then((res) =>
				res.json(),
			)) as ApiSuccessResponse<DeviceInfoResponse>;

			if (!response.data) {
				setInvalidCode(true);
				setLoading(false);
				return;
			}

			setScopes(response.data.scopes);
			setLoading(false);
		};
		fetchData();

		return () => abortController.abort();
	}, [code]);

	const handleApprove = async () => {
		setSubmittingApprove(true);
		const response = (await fetch(
			`${process.env.NEXT_PUBLIC_API_ENDPOINT}/device/approve`,
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
			`${process.env.NEXT_PUBLIC_API_ENDPOINT}/device/deny`,
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

	if (loading || (!scopes && !invalidCode)) {
		return (
			<div className="flex flex-col gap-4 justify-center items-center w-full h-screen">
				<Spinner />
				<p>This might take a while...</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<AlertDialog open={invalidCode}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<TriangleAlertIcon />
						</AlertDialogMedia>
						<AlertDialogTitle>Invalid Code</AlertDialogTitle>
						<AlertDialogDescription>
							The provided code is invalid or has expired.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction className="w-full" asChild>
							<Link href="/device">Go Back</Link>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{scopes && (
				<div className="w-full max-w-md md:max-w-lg">
					<div className="flex flex-col gap-6">
						<Card className="mx-auto max-w-md">
							<CardHeader>
								<CardTitle>
									Verify an external device/application
								</CardTitle>
							</CardHeader>
							<CardContent>
								Are you sure that you want to authenticate with
								this application? This will give access to the
								following scopes:
								<div className="flex flex-col gap-2 p-2 pt-4">
									{scopes.map((scope, index) => (
										<div
											key={index}
											className="flex gap-1 items-center"
										>
											<CheckCircle2Icon
												height="22"
												width="22"
											/>
											<p>{scopesDescriptions[scope]}</p>
										</div>
									))}
								</div>
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
			)}
			<div className="flex justify-end max-w-full">
				<ThemeSwitcher />
			</div>
		</div>
	);
}
