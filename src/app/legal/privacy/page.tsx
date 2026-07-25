import {
	ArrowLeftCircleIcon,
	CookieIcon,
	DatabaseIcon,
	InfoIcon,
	ServerIcon,
	ShieldCheckIcon,
	Trash2Icon,
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

export default function PrivacyPage() {
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
								<ShieldCheckIcon className="h-6 w-6 text-muted-foreground" />
								<CardTitle className="text-3xl font-bold">
									Privacy Policy
								</CardTitle>
							</div>
							<CardDescription className="text-sm pt-1">
								Last Updated: July 2026
							</CardDescription>
						</CardHeader>

						<CardContent className="flex flex-col gap-4">
							<Alert className="bg-muted/50">
								<InfoIcon />
								<AlertTitle>TL;DR</AlertTitle>
								<AlertDescription>
									We don't sell your data, we don't serve ads,
									and we don't track you. We only collect
									what's necessary for you to just play chess
									;D
								</AlertDescription>
							</Alert>

							<div className="flex items-center gap-2">
								<DatabaseIcon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									1. What We Collect & Why
								</h2>
							</div>
							<div className="pl-7">
								<p>
									<strong>Account Info:</strong> Your provided
									name, username, email address, and hashed
									password (if you register with your email).
									If you use Google or Discord, we get your
									basic profile ID and email.
								</p>
								<p>
									<strong>Security Info:</strong> When you log
									in, (
									<code className="bg-muted px-1.5 py-0.5 rounded font-mono">
										better-auth
									</code>
									) logs your IP address and user agent. This
									is purely to detect any suspicious logins.
								</p>
								<p>
									<strong>Game History:</strong> Your moves,
									matches, and ratings are saved.
								</p>
							</div>

							<div className="flex items-center gap-2">
								<CookieIcon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									2. Cookies
								</h2>
							</div>
							<p className="pl-7">
								We only use <strong>essential cookies</strong>{" "}
								to keep you logged in, nothing else.
							</p>

							<div className="flex items-center gap-2">
								<ServerIcon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									3. Third-Party Services
								</h2>
							</div>
							<p className="pl-7">
								We keep third-party services to an absolute
								minimum:
							</p>
							<ul className="list-disc pl-12">
								<li>
									<strong>Cloudflare Turnstile:</strong> Used
									on login/signup to block automated spam
									bots.
								</li>
								<li>
									<strong>Google & Discord:</strong> Used only
									if you choose to sign in with them.
								</li>
							</ul>

							<div className="flex items-center gap-2">
								<Trash2Icon className="h-5 w-5 text-muted-foreground" />
								<h2 className="text-xl font-bold">
									4. Deleting Your Data
								</h2>
							</div>
							<p className="pl-7">
								Your data belongs to you. You can delete your
								account at any time from your user dashboard.
								This immediately removes all of your personal
								details from our primary database.
								<br />
								Match data stays but your user is removed from
								them, and replaced with the @deleted_user
								account so they can't be traced back to you.
							</p>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
