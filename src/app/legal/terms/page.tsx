import {
	AlertTriangleIcon,
	ArrowLeftCircleIcon,
	BotIcon,
	Code2Icon,
	FileTextIcon,
	KeyIcon,
	UserCheckIcon,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function TermsPage() {
	return (
		<div className="relative">
			<Header />

			<main className="flex flex-col items-center">
				<div className="pt-12 px-5 max-w-3xl">
					<Card>
						<CardHeader className="border-b">
							<div>
								<Button variant="link" className="p-0">
									<Link
										href="/legal"
										className="flex gap-2 items-center text-muted-foreground"
									>
										<ArrowLeftCircleIcon className="h-4 w-4 text-muted-foreground" />
										Back to Legal
									</Link>
								</Button>
							</div>
							<div className="flex items-center gap-2">
								<FileTextIcon className="h-6 w-6 text-muted-foreground" />
								<CardTitle className="text-3xl font-bold">
									Terms of Service
								</CardTitle>
							</div>
							<CardDescription className="text-sm pt-1">
								Last Updated: July 2026 - Site:{" "}
								<span className="font-medium underline">
									{process.env.NEXT_PUBLIC_BASE_URL}
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="flex items-center gap-2">
								<UserCheckIcon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									1. Who Can Use This
								</h2>
							</div>
							<p className="pl-7">
								You need to be at least{" "}
								<span className="font-semibold">
									13 years old
								</span>{" "}
								to create an account. If you're between 13 and
								18, we assume you have your parent or guardian's
								permission to play.
							</p>

							<div className="flex items-center gap-2">
								<KeyIcon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									2. Your Account
								</h2>
							</div>
							<ul className="list-disc pl-12">
								<li>
									Keep your login credentials safe. You're
									responsible for whatever happens under your
									account.
								</li>
								<li>
									You can delete your account at any time
									right from your dashboard. No questions
									asked.
								</li>
							</ul>

							<div className="flex items-center gap-2">
								<BotIcon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									3. API, Automation, and Bots
								</h2>
							</div>
							<ul className="list-disc pl-12">
								<li>
									You are welcome to build apps and tools
									using the API!
								</li>
								<li>
									If you want to run a chess engine or
									automated bot, we'd recommend you register a
									dedicated <strong>Bot Account</strong>{" "}
									instead of using your main account.
								</li>
								<li>Don't spam excessive API requests.</li>
							</ul>

							<div className="flex items-center gap-2">
								<Code2Icon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									4. Open Source vs. The Hosted Site
								</h2>
							</div>
							<p className="pl-7">
								The code for Chess Now! is{" "}
								<span className="font-semibold">
									100% open source under the MIT License
								</span>
								. Feel free to fork it or host your own version.
								However, these Terms apply specifically to using
								the hosted server at{" "}
								<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
									{process.env.NEXT_PUBLIC_BASE_URL}
								</code>
								.
							</p>

							<Alert>
								<AlertTriangleIcon className="h-4 w-4" />
								<AlertTitle>5. Provided "As-Is"</AlertTitle>
								<AlertDescription>
									This is an open-source project provided for
									free. While we do our best to keep the
									servers fast and online, we can't guarantee
									100% uptime, and we aren't liable for server
									downtime, restarts or game state loss. Have
									fun!
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
