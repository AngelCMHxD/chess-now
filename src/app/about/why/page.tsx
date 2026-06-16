import type { NavigationSection } from "@/components/blocks/hero/header";
import Header from "@/components/blocks/hero/header";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

const navigationData: NavigationSection[] = [
	{
		title: "Integrations",
		href: "/about/integrations",
	},
	{
		title: "Why?",
		href: "/about/why",
	},
];

export default function Integrations() {
	return (
		<div className="relative">
			<Header navigationData={navigationData} />

			<main className="flex flex-col items-center min-h-screen w-full">
				<h1 className="text-3xl leading-[1.29167] font-bold text-balance sm:text-4xl lg:text-5xl p-15 pt-30">
					Why make this project?
				</h1>

				<div className="grid grid-cols-1 gap-4 p-4 pr-5 max-md:w-full md:w-[60%]">
					<Card>
						<CardContent className="flex pl-4 pr-4">
							<div className="flex flex-col justify-center w-full">
								<CardDescription>
									<Accordion
										type="single"
										collapsible
										defaultValue="why"
									>
										<AccordionItem value="why">
											<AccordionTrigger className="font-semibold">
												Why this instead of other
												things?
											</AccordionTrigger>
											<AccordionContent>
												I saw a lot of chess projects
												being made for the Stardance
												challenge, so I told myself:
												"Why not make one with a unique
												spin and learn something new on
												the way?"
											</AccordionContent>
										</AccordionItem>
										<AccordionItem value="returns">
											<AccordionTrigger className="font-semibold">
												But lichess exists...
											</AccordionTrigger>
											<AccordionContent>
												Yes, I know it exists, and it's
												amazing, but{" "}
												<a
													href="https://xkcd.com/927/"
													target="_blank"
													rel="noopener noreferrer"
												>
													why have only one
													open-source option?
												</a>{" "}
												The reality is just that I like
												to make some project in my own
												way. And I learn a lot from
												them. ;P
												<br />
												<br />
												With his project, I'm learning a
												lot of things that I've been
												meaning to learn a long time
												ago, like:
												<ul className="list-disc pt-1 pb-1 pl-6 space-y-2">
													<li>
														Frontend, Next.js and
														Tailwind
													</li>
													<li>
														Authentication (Better
														Auth)
													</li>
													<li>
														REST APIs design and
														WebSockets servers
													</li>
													<li>
														Or even just how to
														implement chess
														mechanics :D
													</li>
												</ul>
											</AccordionContent>
										</AccordionItem>
										<AccordionItem value="support">
											<AccordionTrigger className="font-semibold">
												I like this! Can I give
												feedback?
											</AccordionTrigger>
											<AccordionContent>
												For sure! Any feedback is
												appreciated! In your account
												dashboard you can find a
												Feedback button. You can click
												it to give any type of feedback
												or comments about the project.
												<br />
												<br />
												<b>Why inside the dashboard?</b>{" "}
												Mostly to prevent other people
												from botting them or send other
												kind of spam, as you need to
												have an account. Your account
												will be linked to the feedback
												you give, but it'll only be used
												in order to send you my thoughts
												about it to your email ;D
											</AccordionContent>
										</AccordionItem>
									</Accordion>
								</CardDescription>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
