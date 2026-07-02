"use client";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export default function VerifiedPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-xl">
				<div className={cn("flex flex-col gap-6")}>
					<Card className="overflow-hidden p-0">
						<CardContent className="grid p-0">
							<div className="p-2 pb-1 md:p-4 md:pb-1">
								<FieldGroup>
									<div className="flex flex-col items-center gap-2 text-center pt-1">
										<h1 className="text-2xl font-bold">
											Account Creation
										</h1>
									</div>
									<div>
										<Alert className="bg-accent">
											<InfoIcon />
											<AlertTitle>Success</AlertTitle>
											<AlertDescription>
												Your account has been verified
												successfully.
											</AlertDescription>
										</Alert>
									</div>
								</FieldGroup>
							</div>
						</CardContent>
						<CardFooter className="flex flex-col gap-2">
							<Button
								variant="default"
								className="w-full"
								asChild
							>
								<Link href="/account/dashboard">
									Go to Dashboard
								</Link>
							</Button>
							<Button
								variant="secondary"
								className="w-full"
								asChild
							>
								<Link href="/">Back to Home</Link>
							</Button>
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
