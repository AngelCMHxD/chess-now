import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "react-email";
import { emailsTailwindConfig } from "./theme";
import { EmailsFonts } from "./theme-fonts";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
export interface WelcomeEmailProps {
	url: string;
}

export const WelcomeEmail = ({ url }: WelcomeEmailProps) => (
	<Tailwind config={emailsTailwindConfig}>
		<Html>
			<Head>
				<EmailsFonts />
			</Head>

			<Body className="bg-bg-2 m-0 font-sans text-center">
				<Preview>Welcome aboard</Preview>
				<Container className="mx-auto mt-8 mobile:mt-0 w-full max-w-160">
					<Section>
						<Section className="bg-bg px-6 mobile:px-2 py-4">
							<Section className="mb-3 px-6">
								<Row>
									<Column className="py-[7px] w-1/2 align-middle">
										<Row>
											<Column className="w-[32px] align-middle">
												<Img
													src={`${baseUrl}/static/icon.png`}
													alt=""
													width={23}
													className="block"
												/>
											</Column>
										</Row>
									</Column>
									<Column
										align="right"
										className="py-[7px] w-1/2 align-middle"
									>
										<Text className="m-0 font-13 font-sans text-right">
											<span className="text-fg-3">
												Chess Now!
											</span>
										</Text>
									</Column>
								</Row>
							</Section>

							<Section className="bg-bg-2 mb-6 mobile:mb-2 px-5 mobile:px-4 pt-5 mobile:pt-4 pb-14 mobile:pb-10 rounded-[10px]">
								<Section className="mb-10">
									<Img
										src={`${baseUrl}/static/banner.png`}
										alt=""
										width={600}
										className="block mx-auto rounded-[12px] w-full max-w-[600px]"
									/>
								</Section>
								<Section className="mx-auto max-w-[422px] text-center">
									<Text className="mt-0 mb-6 font-13 font-sans text-fg-3">
										Thanks for joining us
									</Text>
									<Heading
										as="h1"
										className="mt-0 mb-6 font-40 font-sans text-fg"
									>
										Welcome to Chess Now!
									</Heading>
									<Text className="m-0 font-16 font-sans text-fg-2">
										You&apos;re all set. Open your dashboard
										to manage your connections, discover
										more integrations, and challenge other
										people when you&apos;re ready.
									</Text>
								</Section>
							</Section>

							<Section className="bg-bg-2 mb-6 mobile:mb-2 px-5 mobile:px-4 pt-5 mobile:pt-4 pb-14 mobile:pb-10 rounded-[10px]">
								<Section className="pt-3 px-6">
									<Heading
										as="h2"
										className="mt-0 mb-10 font-32 font-sans text-fg"
									>
										Getting started
									</Heading>
									<Section className="mb-10">
										<Row className="mb-9 text-left">
											<WelcomeBulletCell
												title="Play!"
												text="Play and challenge other players!"
												icon="swords"
											/>
											<WelcomeBulletCell
												title="Compete"
												text="Improve your ELO and suprass your friends."
												icon="trophy"
											/>
										</Row>
										<Row className="mb-3 text-left">
											<WelcomeBulletCell
												title="Integrate"
												text="If you are a developer and love chess, you are in luck! We have a really complete API, you can do anything we can."
												icon="terminal"
											/>
											<WelcomeBulletCell
												title="Feedback"
												text="We appreciate any feedback you might want to give us. We are trying our best to improve this as much as we can."
												icon="message-square-heart"
												isLast
											/>
										</Row>
									</Section>
									<Section className="text-center">
										<Button
											href={url}
											className="inline-block bg-fg px-7 py-4 rounded-lg font-16 font-sans text-fg-inverted text-center leading-6"
										>
											Open dashboard
										</Button>
									</Section>
								</Section>
							</Section>

							<Section className="bg-bg-2 mb-6 mobile:mb-2 px-6 mobile:px-4 py-14 mobile:py-10 rounded-[10px]">
								<Section className="mb-8 text-center">
									<Section className="bg-black mx-auto p-3 rounded-xl w-14 text-center">
										<Img
											src={`${baseUrl}/static/icon.png`}
											alt=""
											width={32}
											className="block mx-auto"
										/>
									</Section>
								</Section>
								<Text className="mt-0 mb-8 font-28 font-sans text-fg-2 text-center">
									Start playing Chess Now!
									<br />
									An open way to play chess.
								</Text>
								<Section className="text-center">
									<Button
										href={url}
										className="inline-block bg-fg px-7 py-4 rounded-lg font-16 font-sans text-fg-inverted text-center leading-6"
									>
										Go to Dashboard
									</Button>
								</Section>
							</Section>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	</Tailwind>
);

function WelcomeBulletCell({
	isLast,
	title,
	text,
	icon,
}: {
	isLast?: boolean;
	title: string;
	text: string;
	icon: string;
}) {
	return (
		<Column
			className={`mobile:!block mobile:!w-full mobile:!max-w-full w-1/2 pr-8 align-top mobile:pr-0${isLast ? "" : " mobile:mb-8"}`}
		>
			<Text className="mt-0 mb-5">
				<span className="flex border-stroke-strong border-3 border-solid rounded-full size-10 justify-center items-center">
					<Img src={`${baseUrl}/static/lucide/${icon}.png`} />
				</span>
			</Text>
			<Text className="m-0 mobile:!max-w-full font-16 font-sans text-fg-2 text-left font-extrabold">
				{title}
			</Text>
			<Text className="m-0 mobile:!max-w-full font-16 font-sans text-fg-2 text-left">
				{text}
			</Text>
		</Column>
	);
}

WelcomeEmail.PreviewProps = {
	url: "https://example.com/",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
