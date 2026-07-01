import {
	Body,
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

const title = "Your password changed.";

const paragraphs = [
	"Someone (We hope it was you ;D) changed your password and we want to let you know it all went smoothly.",
	"When logging in, remember to use your new password. If it fails or you forgot it once again, don't worry, you can request a new one.",
];

export const PasswordChangedEmail = () => (
	<Tailwind config={emailsTailwindConfig}>
		<Html>
			<Head>
				<EmailsFonts />
			</Head>

			<Body className="bg-bg-2 m-0 text-center font-sans">
				<Preview>Your password changed</Preview>
				<Container className="mobile:mt-0 mx-auto mt-8 w-full max-w-[640px]">
					<Section>
						<Section className="bg-bg mobile:px-2 px-6 py-4">
							<Section className="mb-3 px-6">
								<Row>
									<Column className="w-1/2 py-[7px] align-middle">
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
										className="w-1/2 py-[7px] align-middle"
									>
										<Text className="font-13 m-0 text-right font-sans">
											<span className="text-fg-3">
												Chess Now!
											</span>
										</Text>
									</Column>
								</Row>
							</Section>

							<Section className="bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-20 text-left">
								<Section className="mb-8">
									<Heading
										as="h1"
										className="font-28 text-fg m-0 text-left font-sans"
									>
										{title}
									</Heading>
								</Section>

								{paragraphs.map((block, i) => (
									<Text
										key={i}
										className="font-16 text-fg-2 mt-0 mb-6 max-w-[420px] text-left font-sans last:mb-0"
									>
										{block}
									</Text>
								))}

								<Text className="font-13 text-fg-3 mt-8 mb-0 text-left font-sans">
									Thanks,
									<br />
									The <i>Chess Now!</i> Team
								</Text>
							</Section>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	</Tailwind>
);

PasswordChangedEmail.PreviewProps = {};

export default PasswordChangedEmail;
