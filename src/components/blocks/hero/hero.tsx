import { UserIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";

const HeroSection = () => {
	return (
		<section className="flex flex-1 flex-col justify-between gap-12 overflow-x-hidden pt-8 sm:gap-16 sm:pt-16 lg:gap-24 lg:pt-24">
			<div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
				<Link href="https://stardance.hackclub.com">
					<div className="bg-muted flex items-center gap-2.5 rounded-full border px-2 py-1 text-sm">
						<Badge>Made for the Stardance Challenge</Badge>
						<span className="text-muted-foreground">
							Find about it by clicking here!
						</span>
					</div>
				</Link>

				<h1 className="text-[30px] leading-[1.29167] font-bold text-balance sm:text-[35px] lg:text-[40px]">
					Let's make chess{" "}
					<span className="relative">
						open-source
						<svg
							aria-label="Stroke under 'open-source'"
							width="223"
							height="12"
							viewBox="0 0 223 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="absolute inset-x-0 bottom-0 w-full translate-y-1/2 max-sm:hidden"
						>
							<path
								d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
								stroke="url(#paint0_linear_10365_68643)"
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<defs>
								<linearGradient
									id="paint0_linear_10365_68643"
									x1="18.8541"
									y1="3.72033"
									x2="42.6487"
									y2="66.6308"
									gradientUnits="userSpaceOnUse"
								>
									<stop stopColor="var(--primary)" />
									<stop
										offset="1"
										stopColor="var(--primary-foreground)"
									/>
								</linearGradient>
							</defs>
						</svg>
					</span>
					!
				</h1>

				<p className="text-muted-foreground">
					This project is an open-source API that allows you to
					control chess games through it.
					<br />
					You can make any integration you can think of, without
					worrying about game state storage or auth.
				</p>

				<Button size="lg" asChild>
					<a href="/account/login">Try It Now</a>
				</Button>

				<h1 className="text-2xl leading-[1.29167] font-bold text-balance sm:text-3xl lg:text-4xl pt-30">
					Made by:
				</h1>
				<div className="grid grid-cols-1 gap-4 w-100">
					<Card>
						<CardContent className="flex p-2">
							<div className="p-4">
								<Avatar className="size-12">
									<AvatarImage
										src="https://avatars.githubusercontent.com/u/57822483?v=4"
										alt="Angel (AngelCMHxD) Profile Picture"
										loading="eager"
									/>
									<AvatarFallback>
										<UserIcon />
									</AvatarFallback>
								</Avatar>
							</div>
							<div className="flex flex-col justify-center">
								<CardTitle>
									<span>Angel</span>{" "}
									<span className="text-sm text-muted-foreground">
										(AngelCMHxD)
									</span>
								</CardTitle>
								<CardDescription>
									<div>
										<div className="pt-1 text-left">
											Hope you like it ;P
										</div>
										<div className="pt-2">
											<div className="grid grid-cols-2 gap-2">
												<Button asChild>
													<Link
														href="https://github.com/AngelCMHxD"
														target="_blank"
														rel="noopener noreferrer"
													>
														GitHub
													</Link>
												</Button>
											</div>
										</div>
									</div>
								</CardDescription>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
