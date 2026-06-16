// Import global styles and fonts
"use client";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "404 - Chess Now!",
	description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"h-full",
				"antialiased",
				geistSans.variable,
				geistMono.variable,
				"font-sans",
				inter.variable,
			)}
		>
			<head>
				<link rel="icon" type="image/svg+xml" href="/icon.svg" />
			</head>
			<body className="min-h-full flex flex-col">
				{" "}
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<div className="flex flex-col items-center justify-center flex-1 w-full h-full">
						<Card className="w-full max-w-sm">
							<CardTitle className="flex justify-center text-2xl">
								404 - Not Found
							</CardTitle>
							<CardContent className="flex justify-center">
								The page you are looking for does not exist.
							</CardContent>
							<CardFooter className="flex flex-col gap-2">
								<Button
									variant="default"
									size="lg"
									onClick={() => window.history.back()}
									className="w-full"
								>
									Go Back
								</Button>
								<Button
									variant="secondary"
									size="lg"
									className="w-full"
									asChild
								>
									<a href="/" className="cursor-default">
										Home
									</a>
								</Button>
							</CardFooter>
						</Card>
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
